'use client';

import { useState } from 'react';
import { CONTACT } from '@/data/tree';

const ROW = 'flex items-center gap-3 border-b-2 border-black px-4 py-2';
const LABEL = 'w-16 shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide opacity-60';
const INPUT = 'min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:opacity-35';

export default function Inbox() {
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const ready = Boolean(name.trim() && subject.trim() && body.trim());

  function send() {
    if (!ready) return;
    /* Handed to the visitor's mail client so there is no backend and no secret to
       keep. Swap this one function for a POST when a form service is wired up. */
    // filter(Boolean) drops the optional reply-to line; the blank line before the
    // sign-off is added separately so it can't be filtered out as an empty string.
    const signOff = ['--', name.trim(), from.trim()].filter(Boolean).join('\n');
    const text = `${body.trim()}\n\n${signOff}`;
    const href =
      `mailto:${CONTACT.email}` +
      `?subject=${encodeURIComponent(subject.trim())}` +
      `&body=${encodeURIComponent(text)}`;
    window.location.href = href;
    setSent(true);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fffdf7]">
      <div className="shrink-0 border-b-[3px] border-black">
        <div className={ROW}>
          <span className={LABEL}>To</span>
          {/* Name only — the address stays in the mailto rather than on screen. */}
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
          />
        </div>
        <div className={ROW}>
          <span className={LABEL}>Reply to</span>
          <input
            className={INPUT}
            type="email"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="you@example.com (optional)"
            aria-label="Your email"
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
          />
        </div>
      </div>

      <textarea
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed outline-none placeholder:opacity-35"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your message…"
        aria-label="Message"
      />

      <div className="flex shrink-0 items-center justify-between gap-4 border-t-[3px] border-black bg-[#f2ede3] px-4 py-3">
        <span className="font-mono text-[11px] font-bold opacity-60">
          {sent ? 'Handed to your mail app.' : ready ? 'Ready to send.' : 'Name, subject and message required.'}
        </span>
        <button
          onClick={send}
          disabled={!ready}
          className="rounded-lg border-[3px] border-black bg-[#ffd23f] px-4 py-1.5 font-mono text-xs font-bold
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-transform
                     enabled:hover:-translate-y-0.5 disabled:opacity-30 disabled:shadow-none"
        >
          Send
        </button>
      </div>
    </div>
  );
}
