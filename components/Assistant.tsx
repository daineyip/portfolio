'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp, Minus, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useHint } from '@/store/useHint';
import OpenLink from './OpenLink';

/**
 * The desktop's assistant, parked in the bottom-right corner of the wallpaper.
 *
 * Deliberately **not** a window, and so deliberately not in `useWindowStore`: it
 * has no title bar, never appears in the taskbar, can't be dragged or snapped, and
 * collapses to a bubble rather than minimizing to a tab. The same reasoning that
 * keeps the command palette out of the window store keeps this out — see
 * store/useSearch.ts. The conversation lives in this component's own state and the
 * component stays mounted while collapsed, so shrinking to the bubble hides the
 * thread without losing it.
 *
 * It renders as a sibling of DesktopWrapper rather than inside it, for the same
 * reason CommandPalette does: the wrapper carries `isolate`, and anything inside it
 * is trapped under the menu bar and taskbar. This has to float over the windows.
 *
 * ## Pointing at the desktop
 *
 * The endpoint answers in one short sentence and puts the rest of the message in
 * `<Open id="…">` tags — the same tag the .mdx documents use. Those are rendered
 * here as real `OpenLink`s, which is the whole trick: hovering one in a chat answer
 * pulses the icon holding it exactly as hovering one in the Home readme does,
 * because it is the identical component talking to the identical store. Nothing
 * about hover-to-locate had to be rebuilt for the chat.
 *
 * The stream's `hint` events are the other half — the part hover can't do, which is
 * leading someone who doesn't yet know there is anything to hover. When an answer
 * lands, the first place it points at pulses on its own for a beat and then lets go.
 */

const ENDPOINT = '/api/chat';

/**
 * How long an answer's first hint pulses before it hands the desktop back.
 *
 * Long enough to be followed, not just noticed: the visitor has to read the
 * sentence first and only then look up to see what it lit. A pulse that expires
 * while they are still reading has pointed at nothing. Hovering any link in the
 * answer takes the pulse over before this elapses anyway, so the only cost of a
 * generous number is a slightly later return to a quiet desktop.
 */
const LEAD_MS = 6000;

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING =
  "Ask me about Daine's work and I'll point you to it.";

/*
 * `<Open id="x">label</Open>` in the answer text becomes the real component.
 *
 * Two things make this a parser rather than a regex replace, and both are about
 * the text arriving a character at a time. A tag that is half-written must not be
 * shown as markup, and a tag that is *open* but not yet closed must render its
 * label as plain text until the closing tag turns up — so a link appears once,
 * finished, rather than flickering into being mid-word.
 */
const PAIR = /<Open\s+id="([^"]+)"\s*>([\s\S]*?)<\/Open>/g;
const DANGLING_TAG = /<[^>]*$/;
const UNCLOSED_OPEN = /<Open\s+id="([^"]+)"\s*>([\s\S]*)$/;

function render(answer: string): ReactNode[] {
  // Whatever is mid-tag right now is not text the visitor should see.
  const text = answer.replace(DANGLING_TAG, '');
  const out: ReactNode[] = [];
  let at = 0;
  let key = 0;

  PAIR.lastIndex = 0;
  for (let m = PAIR.exec(text); m; m = PAIR.exec(text)) {
    if (m.index > at) out.push(text.slice(at, m.index));
    out.push(
      <OpenLink key={(key += 1)} id={m[1]}>
        {m[2]}
      </OpenLink>,
    );
    at = PAIR.lastIndex;
  }

  const tail = text.slice(at);
  const pending = tail.match(UNCLOSED_OPEN);
  // A tag still being written: show its label, plainly, until it closes.
  out.push(pending ? tail.slice(0, pending.index) + pending[2] : tail);
  return out;
}

function Bubble({ turn }: { turn: Turn }) {
  const mine = turn.role === 'user';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl border-[3px] border-black px-3 py-2 text-[13px] leading-relaxed ${
          mine ? 'bg-black font-medium text-[#fffdf7]' : 'bg-[#fffdf7]'
        }`}
      >
        {mine ? turn.content : render(turn.content)}
      </div>
    </div>
  );
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setHint = useHint((s) => s.setHint);
  const still = useReducedMotion();

  const scroller = useRef<HTMLDivElement>(null);
  const lead = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Follow the answer as it streams. */
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [turns, busy]);

  /* A pulse this component started is a pulse it has to put down — whenever a new
     question makes the last answer's lead stale, and on unmount. */
  const dropLead = () => {
    if (lead.current) clearTimeout(lead.current);
    lead.current = null;
    setHint(null);
  };

  useEffect(
    () => () => {
      if (lead.current) clearTimeout(lead.current);
      setHint(null);
    },
    [setHint],
  );

  async function send() {
    const question = draft.trim();
    if (!question || busy) return;

    dropLead();
    setError(null);
    setDraft('');
    setBusy(true);

    const history: Turn[] = [...turns, { role: 'user', content: question }];
    setTurns([...history, { role: 'assistant', content: '' }]);

    /** Rewrite the answer in place — it is always the last turn. */
    const write = (text: string) =>
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, content: text } : t)));

    let answer = '';
    const hints: string[] = [];

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      /* Two failure shapes, and this is the one that arrives before any token:
         a status code and a JSON body. See app/api/chat/route.ts. */
      if (!res.ok || !res.body) {
        const { error: message } = await res.json().catch(() => ({ error: null }));
        throw new Error(message ?? 'The assistant is not answering right now.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        pending += decoder.decode(value, { stream: true });
        const frames = pending.split('\n\n');
        pending = frames.pop() ?? '';

        for (const frame of frames) {
          if (!frame.startsWith('data:')) continue;
          const packet = JSON.parse(frame.slice(5).trim());

          if (packet.type === 'text') write((answer += packet.text));
          else if (packet.type === 'hint') hints.push(packet.id);
          else if (packet.type === 'error') throw new Error(packet.message);
        }
      }

      /*
       * Lead the visitor to the first place the answer pointed. `useHint` holds one
       * id at a time, so this sets one and only one — replaying the whole list would
       * flicker through them and land on the last. Hovering any link in the answer
       * takes the pulse over from here, which is the behaviour we want: the lead is
       * a suggestion, and the pointer outranks it.
       */
      if (hints[0]) {
        setHint(hints[0]);
        lead.current = setTimeout(() => setHint(null), LEAD_MS);
      }
    } catch (failure) {
      // An answer that got partway is worth keeping; an empty one is just noise.
      if (!answer) setTurns(history);
      setError(failure instanceof Error ? failure.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const spring = still ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 32 };

  return (
    /* Above the windows and the taskbar, below the command palette (z-40) and the
       cursor (z-50). Sits clear of the taskbar and on the desktop's page margin. */
    <div className="pointer-events-none fixed bottom-14 right-7 z-30">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: still ? 1 : 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: still ? 1 : 0.9 }}
            transition={spring}
            /* Bottom right, so it grows out of the bubble it replaced. */
            style={{ transformOrigin: '100% 100%' }}
            className="pointer-events-auto flex h-[min(28rem,calc(100vh-10rem))] w-[22rem] flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-[#f2ede3] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <header className="flex shrink-0 items-center gap-2 border-b-[3px] border-black bg-black px-3 py-2">
              <Sparkles className="h-4 w-4 shrink-0 text-[#ffd23f]" strokeWidth={2.5} />
              <span className="flex-1 font-mono text-xs font-bold uppercase tracking-wide text-[#fffdf7]">
                Ask about Daine
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize the assistant"
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-black bg-[#ffd23f] hover:bg-[#fffdf7]"
              >
                <Minus className="h-3 w-3 text-black" strokeWidth={3} />
              </button>
            </header>

            <div
              ref={scroller}
              aria-live="polite"
              className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
            >
              {turns.length === 0 && (
                <p className="rounded-xl border-[3px] border-dashed border-black/30 px-3 py-2 text-[13px] leading-relaxed text-black/70">
                  {GREETING}
                </p>
              )}
              {turns.map((turn, i) => (
                <Bubble key={i} turn={turn} />
              ))}
              {busy && turns[turns.length - 1]?.content === '' && (
                <div className="flex gap-1 px-1" aria-label="Thinking">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-black"
                      animate={still ? {} : { opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.15 }}
                    />
                  ))}
                </div>
              )}
              {error && (
                <p className="rounded-xl border-[3px] border-[#d94f2b] bg-[#d94f2b0d] px-3 py-2 text-[13px] text-[#d94f2b]">
                  {error}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t-[3px] border-black bg-[#fffdf7] px-2 py-2">
              <input
                /* `autoFocus`, not an effect keyed on `open`: AnimatePresence is
                   `mode="wait"`, so the panel does not mount until the bubble has
                   finished exiting — an effect firing on the state change finds a
                   null ref and focuses nothing. The attribute fires on mount, which
                   is the moment that actually exists. */
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  /* Escape belongs to the panel; Shortcuts.tsx already ignores keys
                     typed into a field, so nothing else is listening. */
                  if (e.key === 'Enter') send();
                  else if (e.key === 'Escape') setOpen(false);
                }}
                placeholder="Ask a question…"
                className="min-w-0 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-black/40"
              />
              <button
                type="button"
                onClick={send}
                disabled={busy || !draft.trim()}
                aria-label="Send"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-[3px] border-black bg-[#ffd23f] disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5 text-black" strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="bubble"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open the assistant"
            initial={{ opacity: 0, scale: still ? 1 : 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: still ? 1 : 0.6 }}
            transition={spring}
            style={{ transformOrigin: '100% 100%' }}
            className="pointer-events-auto grid h-14 w-14 place-items-center rounded-full border-[3px] border-black bg-[#ffd23f] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fffdf7]"
          >
            {/* No status dot. The menu bar already spends a coloured dot on
                whether Daine is open to work, and a second one down here would be
                read as saying something about that. */}
            <Sparkles className="h-6 w-6 text-black" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
