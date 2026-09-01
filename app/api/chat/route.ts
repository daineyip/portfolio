import { hintFor } from '@/data/tree';
import { rateLimit } from '@/lib/rate-limit';
import { NODE_IDS, systemPromptFor } from '@/lib/portfolio-context';

/**
 * POST /api/chat — the desktop's assistant.
 *
 * Runs on the edge, so it starts streaming in tens of milliseconds rather than
 * waiting on a cold Node lambda. That is also why nothing in its import graph
 * touches `node:fs`: the documents reach it as a JSON module built by
 * scripts/build-content.mjs (see lib/portfolio-context.ts).
 *
 * The prompt is built per question rather than once: the catalog of every node
 * always ships, so the assistant can point anywhere, but only the documents the
 * question reached for come with it. See lib/portfolio-context.ts.
 *
 * Request:  { messages: [{ role: 'user' | 'assistant', content: string }] }
 * Response: two shapes, and a client has to handle both. A failure that happens
 * *before* the first token — malformed request, no key, the provider refusing —
 * is a plain JSON `{ error }` with a 4xx/5xx status, because nothing has been
 * streamed yet and the status code is still worth something. Once streaming has
 * started the status is committed to 200, so anything that goes wrong after that
 * arrives as an `error` event inside the stream.
 *
 * The stream is text/event-stream, one JSON object per `data:` line —
 *
 *   { type: 'text',  text: string }          a delta of the answer, in order
 *   { type: 'hint',  id: string, node: string } somewhere to look, see below
 *   { type: 'done' }                          the model finished
 *   { type: 'error', message: string }        give up and show this
 *
 * A hint's `id` is what to hand `useHint`, and it is the same kind of id the home
 * readme's <Open> links publish — one a surface can answer. `node` is what the
 * answer actually named, which may be deeper: an answer about `work-binance`
 * pulses `work`, because that is the icon the visitor can see and click. See
 * `hintFor` in data/tree.ts.
 *
 * `useHint` holds one id at a time, so a client should not replay every hint into
 * it in sequence — that flickers through them and lands on the last. Hover is the
 * home page's model and should stay the chat's: render the streamed <Open> tags as
 * the real OpenLink component and hover works identically, for free. The events
 * are for leading the visitor *before* they hover.
 *
 * The hints are not a second channel the model has to remember to fill in: they
 * are read out of the prose as it streams. The model points at things by writing
 * `<Open id="...">label</Open>`, exactly the tag the .mdx documents use, and every
 * completed tag with a real id is emitted as a hint the moment it appears. So the
 * icon can start pulsing while the sentence naming it is still being typed, and a
 * hallucinated id can only cost a link — `<Open>` already renders an unknown id as
 * plain text (components/OpenLink.tsx), and this route drops it from the hints.
 *
 * ## The model
 *
 * Written against the OpenAI-compatible `/chat/completions` shape rather than any
 * vendor's SDK, because every cheap host of open models speaks it: Groq,
 * Together, OpenRouter, DeepInfra, Fireworks, and a local Ollama. So the provider
 * is three environment variables and not a line of code, and the edge bundle
 * carries no client library at all.
 *
 *   CHAT_API_KEY   required
 *   CHAT_BASE_URL  default https://api.groq.com/openai/v1
 *   CHAT_MODEL     default qwen/qwen3.8-27b
 *   CHAT_REASONING_EFFORT  default "none"; empty string omits the parameter
 *
 * The same weights carry a different slug on every host, and the hosts add and
 * retire them — a 404 `model_not_found` in the server log means CHAT_MODEL has
 * moved, and `GET {CHAT_BASE_URL}/models` says what the key can actually reach.
 * The default is what Groq served when this was written; Together and DeepInfra
 * spell their Qwen builds `Qwen/Qwen3-...` instead.
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const BASE_URL = process.env.CHAT_BASE_URL ?? 'https://api.groq.com/openai/v1';
const MODEL = process.env.CHAT_MODEL ?? 'qwen/qwen3.6-27b';

/*
 * Qwen3 is a reasoning model, and left alone it spends several hundred tokens
 * thinking before it writes a word of a four-sentence answer. Nothing here needs
 * it: the answer is in the excerpts, and the job is to restate it and attach the
 * right ids. Turning it off is worth more than it costs on every axis — fewer
 * tokens billed, a faster first word, and no chain of thought to leak.
 *
 * `reasoning_effort` is Groq/OpenAI-shaped, and its allowed values are per-model:
 * the qwen3 family takes "none", gpt-oss takes only low/medium/high and would 400
 * on it. So it is an environment variable, and setting CHAT_REASONING_EFFORT to
 * an empty string omits the parameter entirely for a provider that has never
 * heard of it.
 */
const REASONING_EFFORT = process.env.CHAT_REASONING_EFFORT ?? 'none';

/*
 * The prompt asks for one short sentence, so this is a backstop rather than a
 * target — but it is not free headroom: providers count `max_completion_tokens`
 * in full against a per-minute token budget when they admit the request, so an
 * inflated ceiling costs throughput even when every answer comes in short.
 *
 * Raise it if answers start getting cut mid-sentence; the length is set by the
 * Voice section of the prompt, and that is the dial to turn first.
 */
const MAX_COMPLETION_TOKENS = 150;

/* Low, not zero: the answer must come out of the documents, and this is recall
   rather than writing. */
const TEMPERATURE = 0.3;

/*
 * Sixty a minute from one address — a bound on scripted hammering, not on spend.
 * It is worth being clear about what this does and does not do: at roughly 4.5k
 * tokens a request, sixty of them is ~270k tokens a minute against a provider
 * ceiling of 8,000, so the provider's own 429 is what actually stops a flood and
 * this limit will rarely be the thing that fires. It stops a script opening
 * thousands of connections; it does not protect the bill. Lower it, or add a
 * global cap alongside the per-IP one, if cost is the thing to defend.
 */
const LIMIT = { max: 60, windowSeconds: 60 };

/* Input caps: these bound what a single request can cost, which is a different
   question from how many a visitor may send. */
const MAX_TURNS = 24;
const MAX_CHARS = 2000;

type Turn = { role: 'user' | 'assistant'; content: string };

/*
 * Two different 429s, and they are not the same event, so they do not say the same
 * thing. Ours is a plain quota: this visitor is going too fast, and waiting fixes
 * it. The provider's means the model itself is out of budget — a fact about the
 * assistant, not about the person typing — which is what earns it a line with some
 * character in it.
 */
const RATE_LIMITED = 'Rate limit exceeded - Try again in a few moments';
const TOKENS_SPENT = "Easy on the AI pal, these tokens ain't free!";

const encoder = new TextEncoder();
const event = (data: unknown) => encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

/** `<Open id="...">` — the same tag the documents use, and the source of hints. */
const OPEN_TAG = /<Open\s+id="([^"]+)"/g;

/*
 * Belt and braces against a chain of thought reaching the bubble. REASONING_EFFORT
 * above should stop one being produced at all, but that parameter is named
 * differently by every provider and honoured by only some models, and when it is
 * ignored the thinking arrives inline in the content stream wrapped in
 * <think></think>. This filter costs nothing when there is nothing to filter, and
 * it is the difference between a wrong env var being a config mistake and it being
 * a visitor reading the model's notes to itself.
 */
const THINK_OPEN = '<think>';
const THINK_CLOSE = '</think>';

/** Never release a tail that could still turn out to be half of either tag. */
const HOLDBACK = THINK_CLOSE.length - 1;

/**
 * A stateful filter over the content stream: returns the visible text revealed by
 * this chunk, holding back anything that might be the start of a `<think>` tag
 * until the next chunk settles it. `flush` gives up that holdback at end of
 * stream.
 */
function thinkFilter() {
  let raw = '';
  let cursor = 0;
  let thinking = false;

  return (chunk: string, flush = false): string => {
    raw += chunk;
    let visible = '';

    for (;;) {
      if (thinking) {
        const close = raw.indexOf(THINK_CLOSE, cursor);
        if (close === -1) {
          // Discard the thought; keep back only enough to spot a split tag.
          cursor = Math.max(cursor, raw.length - HOLDBACK);
          return visible;
        }
        cursor = close + THINK_CLOSE.length;
        thinking = false;
        continue;
      }

      const open = raw.indexOf(THINK_OPEN, cursor);
      if (open === -1) {
        const safe = flush ? raw.length : Math.max(cursor, raw.length - HOLDBACK);
        visible += raw.slice(cursor, safe);
        cursor = safe;
        return visible;
      }
      visible += raw.slice(cursor, open);
      cursor = open + THINK_OPEN.length;
      thinking = true;
    }
  };
}

function parseTurns(body: unknown): Turn[] | null {
  if (!body || typeof body !== 'object') return null;
  const { messages } = body as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_TURNS) return null;

  const turns: Turn[] = [];
  for (const message of messages) {
    if (!message || typeof message !== 'object') return null;
    const { role, content } = message as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || !content.trim() || content.length > MAX_CHARS) return null;
    turns.push({ role, content });
  }
  // The conversation has to open with the visitor.
  return turns[0].role === 'user' ? turns : null;
}

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  /* A soft guard against the endpoint being embedded from somewhere else. A
     request with no Origin at all (curl, a server) is let through — this is a
     public assistant, not a private API. */
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return fail('Bad origin', 403);

  const key = process.env.CHAT_API_KEY;
  if (!key) return fail('The assistant is not configured', 503);

  let turns: Turn[] | null = null;
  try {
    turns = parseTurns(await req.json());
  } catch {
    return fail('Malformed request', 400);
  }
  if (!turns) return fail('Malformed request', 400);

  /* After parsing so malformed junk does not burn a real visitor's budget, and
     before the upstream call so nothing over the limit costs tokens. */
  const limit = await rateLimit(req, 'chat', LIMIT);
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: RATE_LIMITED }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(limit.retryAfter) },
    });
  }

  /* What the documents are chosen against: the last thing asked, plus the one
     before it, so a follow-up ("what about the second one?") still reaches the
     subject it is following up on. */
  const query = turns
    .filter((turn) => turn.role === 'user')
    .slice(-2)
    .map((turn) => turn.content)
    .join(' ');
  const system = systemPromptFor(query);

  let upstream: Response;
  try {
    upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        // `max_tokens` is deprecated in this API shape; this is the current name.
        max_completion_tokens: MAX_COMPLETION_TOKENS,
        temperature: TEMPERATURE,
        ...(REASONING_EFFORT ? { reasoning_effort: REASONING_EFFORT } : {}),
        messages: [{ role: 'system', content: system }, ...turns],
      }),
      signal: req.signal,
    });
  } catch {
    return fail('Could not reach the assistant', 502);
  }

  if (!upstream.ok || !upstream.body) {
    console.error('[api/chat]', upstream.status, await upstream.text().catch(() => ''));
    const limited = upstream.status === 429;
    /* The rate limit is the one upstream failure a visitor can actually cause, and
       the one they can do something about, so it gets a line with a shrug in it
       rather than an apology. Everything else is the site's fault, not theirs. */
    return fail(
      limited ? TOKENS_SPENT : 'Something went wrong reaching the assistant.',
      limited ? 429 : 502,
    );
  }

  const body = upstream.body;

  const stream = new ReadableStream({
    async start(controller) {
      /* Ids already sent, so a node named three times pulses once, and how far
         into the answer the tag scanner has read. A tag split across two deltas
         simply fails to match until the delta that completes it arrives. */
      const seen = new Set<string>();
      const unthink = thinkFilter();
      let answer = '';
      let scanned = 0;

      /** Send visible text, and any node it just named, in that order. */
      const emit = (raw: string) => {
        /* A suppressed <think> block leaves the newlines that followed it, and an
           answer that opens with blank lines is a bubble that opens empty. Only
           the run-up to the first real character is dropped; whitespace inside the
           answer is the model's own. */
        const text = answer ? raw : raw.trimStart();
        if (!text) return;
        answer += text;
        controller.enqueue(event({ type: 'text', text }));

        OPEN_TAG.lastIndex = scanned;
        for (let m = OPEN_TAG.exec(answer); m; m = OPEN_TAG.exec(answer)) {
          scanned = OPEN_TAG.lastIndex;
          const node = m[1];
          if (!NODE_IDS.has(node)) continue; // an id the model invented

          /* Dedupe on where it points, not on what it named: two answers
             mentioning two Binance documents are one place to look. */
          const id = hintFor(node);
          if (id && !seen.has(id)) {
            seen.add(id);
            controller.enqueue(event({ type: 'hint', id, node }));
          }
        }
      };

      const reader = body.getReader();
      const decoder = new TextDecoder();
      /* The upstream is SSE too, and its frames do not line up with network
         chunks — a `data:` line routinely arrives in two pieces. Hold the tail
         until a blank line proves the frame is whole. */
      let pending = '';

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          pending += decoder.decode(value, { stream: true });
          const frames = pending.split('\n\n');
          pending = frames.pop() ?? '';

          for (const frame of frames) {
            for (const line of frame.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              let text: unknown;
              try {
                text = JSON.parse(payload)?.choices?.[0]?.delta?.content;
              } catch {
                continue; // a keep-alive or a frame we don't recognise
              }
              if (typeof text !== 'string' || !text) continue;

              emit(unthink(text));
            }
          }
        }

        emit(unthink('', true)); // release whatever was held back
        controller.enqueue(event({ type: 'done' }));
      } catch (error) {
        if (req.signal.aborted) return; // the visitor closed the window; nothing to say
        console.error('[api/chat]', error);
        controller.enqueue(event({ type: 'error', message: 'The answer was cut off.' }));
      } finally {
        reader.cancel().catch(() => {});
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
    },
  });
}
