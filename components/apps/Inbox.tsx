'use client';

import { useState } from 'react';
import { CONTACT } from '@/data/tree';

/**
 * A compose window that actually sends. `POST /api/contact` hands the message to
 * Resend server-side.
 *
 * It used to build a `mailto:` and hand off to the visitor's mail app, which meant
 * the address had to be in the page — it was, in the served HTML, for any scraper
 * to take. Nothing here knows where the message goes now: the destination lives in
 * `CONTACT_EMAIL` on the server, and this form only collects who is writing and
 * what they want to say. The "To" line is a name, not an address, and that is the
 * whole of what the client is told.
 *
 * Reply-to is required rather than optional, which the mailto version could afford
 * to leave blank: a message that arrives from the sending domain with no way back
 * to its author is not a message, it is a note in a bottle.
 */

const ROW = 'flex items-center gap-3 border-b-2 border-black px-4 py-2';
const LABEL = 'w-16 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide opacity-60';
const INPUT = 'min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:opacity-35';

type State = 'idle' | 'sending' | 'sent';

export default function Inbox() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  /* The honeypot. Never shown, never labelled, so only a bot filling every input
     it finds will put anything in it. */
  const [website, setWebsite] = useState('');

  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  const ready = Boolean(name.trim() && email.trim() && subject.trim() && message.trim());

  async function send() {
    if (!ready || state === 'sending') return;
    setState('sending');
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'The message could not be sent.');
      setState('sent');
    } catch (failure) {
      setState('idle');
      setError(failure instanceof Error ? failure.message : 'The message could not be sent.');
    }
  }

  /* Sent is a dead end on purpose: the window closes or it doesn't, and a form
     that clears itself invites a second identical message. */
  if (state === 'sent') {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-[#fffdf7] px-8 text-center">
        <span
          className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-black bg-[#35c46a]
                     font-mono text-2xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          aria-hidden
        >
          ✓
        </span>
        <p className="font-mono text-sm font-bold">Sent.</p>
        <p className="max-w-xs text-sm leading-relaxed opacity-70">
          It went straight to {CONTACT.name}&apos;s inbox. He&apos;ll reply to{' '}
          <span className="font-mono">{email.trim()}</span>.
        </p>
      </div>
    );
  }

  const busy = state === 'sending';

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fffdf7]">
      <div className="shrink-0 border-b-[3px] border-black">
        <div className={ROW}>
          <span className={LABEL}>To</span>
          {/* A name, never an address — the server knows where this goes. */}
          <span className="truncate font-mono text-sm font-bold">{CONTACT.name}</span>
        </div>
        <div className={ROW}>
          <span className={LABEL}>From</span>
          <input
            className={INPUT}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            aria-label="Your name"
            disabled={busy}
          />
        </div>
        <div className={ROW}>
          <span className={LABEL}>Reply to</span>
          <input
            className={INPUT}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Your email"
            disabled={busy}
          />
        </div>
        <div className={ROW}>
          <span className={LABEL}>Subject</span>
          <input
            className={INPUT}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="what's this about?"
            aria-label="Subject"
            disabled={busy}
          />
        </div>
      </div>

      {/* Off-screen rather than `display: none`: some bots skip hidden inputs, and
          `tabIndex`/`autoComplete` keep it out of a keyboard user's way. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <textarea
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:opacity-35"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message…"
        aria-label="Message"
        disabled={busy}
      />

      <div className="flex shrink-0 items-center justify-between gap-4 border-t-[3px] border-black bg-[#f2ede3] px-4 py-3">
        <span
          className={`font-mono text-[11px] font-bold ${error ? 'text-[#d94f2b]' : 'opacity-60'}`}
          role={error ? 'alert' : undefined}
        >
          {error ??
            (busy
              ? 'Sending…'
              : ready
                ? 'Ready to send.'
                : 'Name, email, subject and message required.')}
        </span>
        <button
          onClick={send}
          disabled={!ready || busy}
          className="rounded-lg border-[3px] border-black bg-[#ffd23f] px-4 py-1.5 font-mono text-xs font-bold
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform
                     enabled:hover:-translate-y-0.5 disabled:opacity-30 disabled:shadow-none"
        >
          {busy ? 'Sending' : 'Send'}
        </button>
      </div>
    </div>
  );
}
