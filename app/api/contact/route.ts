/**
 * POST /api/contact — the Inbox's send button.
 *
 * Request:  { name, email, subject, message, website? }
 * Response: { ok: true } or { error: string } with a 4xx/5xx status.
 *
 * ## Why this exists at all
 *
 * The Inbox used to build a `mailto:` and hand off to the visitor's mail app,
 * which put **the address on the page** — it sat in the served HTML, readable by
 * anyone viewing source and by every scraper that ever crawled it. Sending
 * server-side is what makes the address a secret: it lives in
 * `CONTACT_EMAIL`, is read only here, and never reaches a browser. That is the
 * point of the route, more than the nicer send experience.
 *
 * Nothing in the client bundle knows where the message goes. The visitor names
 * themselves and their reply address; the destination is not theirs to choose.
 *
 *   RESEND_API_KEY  required
 *   CONTACT_EMAIL   required — where the mail lands. Never sent to the client.
 *   CONTACT_FROM    the verified sender. Defaults to Resend's shared
 *                   `onboarding@resend.dev`, which can only deliver to the address
 *                   that owns the Resend account — fine here, since that is the
 *                   only place this ever sends. Set it to an address on your own
 *                   verified domain to stop relying on that.
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Portfolio <onboarding@resend.dev>';

/* Caps, not validation: they bound what one request can cost and keep a pasted
   novel out of the inbox. The lengths are generous for a real message. */
const LIMITS = { name: 120, email: 200, subject: 200, message: 5000 } as const;

/* Deliberately loose. Address syntax is famously hard to match and the real test
   is whether a reply arrives, so this only catches obvious nonsense. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Message {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function parse(body: unknown): Message | 'spam' | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as Record<string, unknown>;

  /* Honeypot: a field that is invisible and unlabelled in the form, so a person
     never fills it and a bot filling every input does. Answered with the same
     success the sender would have got — telling a bot it was caught only teaches
     whoever wrote it to leave the field alone next time. */
  if (typeof raw.website === 'string' && raw.website.trim()) return 'spam';

  const out: Record<string, string> = {};
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = raw[field];
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > max) return null;
    out[field] = trimmed;
  }
  if (!EMAIL.test(out.email)) return null;

  return out as unknown as Message;
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return fail('Bad origin', 403);

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  if (!key || !to) return fail('The mailbox is not configured', 503);

  let parsed: Message | 'spam' | null = null;
  try {
    parsed = parse(await req.json());
  } catch {
    return fail('Malformed request', 400);
  }
  if (parsed === 'spam') return Response.json({ ok: true }); // see the honeypot note
  if (!parsed) return fail('Please fill in every field with something reasonable.', 400);

  const { name, email, subject, message } = parsed;

  let sent: Response;
  try {
    sent = await fetch(RESEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM ?? DEFAULT_FROM,
        to: [to],
        /* So hitting reply in the mail client answers the visitor, not the
           sending domain — the whole reason the form asks for an address. */
        reply_to: `${name} <${email}>`,
        subject: `[portfolio] ${subject}`,
        /* Plain text: the body is whatever someone typed, and putting untrusted
           input into HTML mail is an injection surface for no gain. Resend
           accepts `text` on its own. The header is here because `from` is the
           sending domain, so the mail does not otherwise say who wrote it. */
        text: `${name} <${email}>\n\n${message}\n`,
      }),
      signal: req.signal,
    });
  } catch {
    return fail('Could not reach the mail service.', 502);
  }

  if (!sent.ok) {
    // Logged server-side only: Resend's errors quote configuration back at you.
    console.error('[api/contact]', sent.status, await sent.text().catch(() => ''));

    if (sent.status === 429) {
      return fail('Too many messages at once — try again in a minute.', 429);
    }
    /* A 4xx from Resend is this deployment being misconfigured — an unverified
       sender domain, a bad key, a recipient the sender is not allowed to reach.
       Retrying cannot fix any of them, so the copy must not promise it can; the
       reason is in the server log, which is the only place it belongs. */
    if (sent.status < 500) {
      return fail('The mailbox is not accepting messages right now.', 502);
    }
    return fail('The message could not be sent. Try again in a moment.', 502);
  }

  return Response.json({ ok: true });
}
