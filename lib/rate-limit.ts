/**
 * A fixed-window rate limit for the edge routes, keyed by caller IP.
 *
 * Two backends, chosen by whether Upstash is configured:
 *
 * **Upstash Redis over REST** when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are set. This is the real one — edge functions run as
 * many short-lived isolates across many regions, so a counter has to live outside
 * the process to mean anything. REST rather than the SDK because it is one `fetch`
 * and the edge bundle stays free of a client library, same as the other routes.
 *
 * **An in-process Map** otherwise. Deliberately kept, and deliberately not trusted:
 * it only sees the requests that happen to land on the same isolate, so a
 * distributed flood walks straight past it. What it does stop is the common case —
 * one script hammering one endpoint, which usually does stay on one isolate — and
 * it makes the limit work in local dev with no accounts to create. Treat it as a
 * speed bump that upgrades to a real limit the moment Upstash is configured.
 *
 * Fails **open**: if Redis is unreachable the request is allowed. A contact form
 * that silently swallows messages during someone else's outage is worse than one
 * that lets a burst through.
 */

export interface Limit {
  /** Requests permitted per window. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface Verdict {
  ok: boolean;
  /** Seconds until the window resets; for the Retry-After header. */
  retryAfter: number;
}

/**
 * Who is calling. Vercel sets `x-forwarded-for`; its first entry is the client and
 * the rest are proxies, so only the first is worth reading — and a caller can put
 * anything in the others.
 */
export function callerKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim();
  /* No header means local dev, where everyone is the same caller anyway. */
  return ip || 'local';
}

/* --- in-process fallback --------------------------------------------------- */

const counters = new Map<string, { count: number; resetAt: number }>();

function localLimit(key: string, limit: Limit): Verdict {
  const now = Date.now();
  const window = limit.windowSeconds * 1000;
  const entry = counters.get(key);

  if (!entry || entry.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + window });
    /* Cheap sweep so a long-lived isolate does not accumulate expired keys; there
       is no other moment to do it without a timer. */
    if (counters.size > 5000) {
      for (const [k, v] of counters) if (v.resetAt <= now) counters.delete(k);
    }
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  return { ok: entry.count <= limit.max, retryAfter };
}

/* --- Upstash --------------------------------------------------------------- */

/**
 * INCR then EXPIRE ... NX, in one round trip. `NX` sets the TTL only when the key
 * has none, which is what makes this a *fixed* window: the first request of a
 * window starts the clock and later ones must not push it back, or a steady
 * trickle would keep the window alive forever and never reset.
 */
async function redisLimit(url: string, token: string, key: string, limit: Limit): Promise<Verdict | null> {
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(limit.windowSeconds), 'NX'],
      ['TTL', key],
    ]),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as Array<{ result?: number }>;
  const count = Number(body?.[0]?.result);
  if (!Number.isFinite(count)) return null;

  const ttl = Number(body?.[2]?.result);
  return {
    ok: count <= limit.max,
    retryAfter: Number.isFinite(ttl) && ttl > 0 ? ttl : limit.windowSeconds,
  };
}

/**
 * Count this request against `name`'s budget for this caller.
 *
 * `name` namespaces the counter, so two routes sharing an IP do not share a limit.
 */
export async function rateLimit(req: Request, name: string, limit: Limit): Promise<Verdict> {
  const key = `rl:${name}:${callerKey(req)}`;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const verdict = await redisLimit(url, token, key, limit);
      if (verdict) return verdict;
      console.error('[rate-limit] unexpected Upstash response; allowing');
    } catch (error) {
      console.error('[rate-limit] Upstash unreachable; allowing', error);
    }
    return { ok: true, retryAfter: 0 }; // fail open, see the header comment
  }

  return localLimit(key, limit);
}
