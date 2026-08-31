'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { INTRO } from '@/data/tree';

/**
 * The intro, rebuilt for a narrow screen.
 *
 * The desktop card expands each chip *sideways*, which works because a chip has a
 * whole line to grow into. At 390px it does not: an opened clause is wider than the
 * screen. So here the clause drops **below** the line instead, and the lines wrap
 * like ordinary text. Same content, same tap-to-learn-more, different axis — which
 * is why this is its own component rather than a prop on the desktop one.
 */
export default function MobileIntro() {
  const [open, setOpen] = useState<string | null>(null);
  const still = useReducedMotion();

  return (
    <div className="flex flex-col gap-3">
      {INTRO.lines.map(({ before, chip }) => {
        const isOpen = open === chip.id;
        return (
          <div key={chip.id}>
            <p className="text-xl font-black leading-snug tracking-tight">
              {before}{' '}
              <button
                onClick={() => setOpen(isOpen ? null : chip.id)}
                aria-expanded={isOpen}
                style={{ backgroundColor: chip.color }}
                className="inline-flex items-center gap-1.5 rounded-full border-[3px] border-black px-2.5 py-0.5
                           align-middle shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
              >
                {chip.label}
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 135 : 0 }}
                  transition={{ duration: still ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-black
                             font-mono text-[10px] font-black leading-none"
                >
                  +
                </motion.span>
              </button>
            </p>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: still ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden font-mono text-xs font-bold"
                >
                  <span className="mt-2 block border-l-[3px] border-black/25 pl-3">{chip.more}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
