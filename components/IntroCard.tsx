'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { INTRO, type IntroChip } from '@/data/tree';

/*
 * A long ease-out: most of the distance is covered early, then it coasts to a stop.
 * Slow enough to read the clause arriving rather than watch it snap into place.
 */
const DURATION = 0.62;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The wallpaper intro: three lines, each ending in a chip that expands in place to
 * a longer clause. Part of the desktop, not the window store — wallpaper you can
 * poke at — and it sits under the windows layer.
 *
 * Every line is `whitespace-nowrap` and holds exactly one chip, so opening a chip
 * only ever widens its own line: the line count is fixed, nothing rewraps, and the
 * lines below stay put. The line is centred, so the growth reads as the text
 * easing outwards rather than the chip shoving it.
 */
export default function IntroCard() {
  const [open, setOpen] = useState<string[]>([]);
  /* Chips are independent: all three can be open at once. */
  const toggle = (id: string) =>
    setOpen((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className="flex flex-col items-center gap-3">
      {INTRO.lines.map(({ before, chip }) => (
        /* Sized down a step at narrow widths so an open chip still fits one line. */
        <p
          key={chip.id}
          className="flex items-center justify-center whitespace-nowrap text-lg font-black
                     tracking-tight text-black md:text-xl lg:text-2xl"
        >
          <span>{before}</span>
          <Chip chip={chip} open={open.includes(chip.id)} onToggle={toggle} />
        </p>
      ))}
    </div>
  );
}

function Chip({
  chip,
  open,
  onToggle,
}: {
  chip: IntroChip;
  open: boolean;
  onToggle: (id: string) => void;
}) {
  const still = useReducedMotion();
  const ease = still ? { duration: 0 } : { duration: DURATION, ease: EASE };

  /*
   * Deliberately no `layout` anywhere in here. Framer's layout animation moves a box
   * by projecting a transform onto it, and its border-radius correction can't hold a
   * `rounded-full` pill together while the box scales — the ends pop between radii.
   * Animating the clause's real width instead means the chip is genuinely that wide
   * on every frame: no transform, no distortion, and the sentence still reflows around
   * it because the layout is actually changing.
   */
  return (
    <button
      onClick={() => onToggle(chip.id)}
      aria-expanded={open}
      style={{ backgroundColor: chip.color }}
      /*
        No flex `gap`: a gap lands in full the moment the clause mounts, popping the
        chip several pixels wider before the width animation has moved at all. All
        spacing sits inside the parts instead — the clause's own padding rides along
        with its animating width.
      */
      className={`ml-3 inline-flex items-center rounded-full border-[3px] border-black px-3 py-0.5
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300
                  ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:outline-none
                  focus-visible:ring-4 focus-visible:ring-black/25 ${open ? '-translate-y-0.5' : ''}`}
    >
      <span className="whitespace-nowrap">{chip.label}</span>

      {/*
        The clause animates its own real width from zero. The line re-centres on
        every frame of that, so the text beside the chip slides continuously instead
        of stepping to a new position.
      */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.span
            key="more"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ ...ease, opacity: { duration: still ? 0 : DURATION * 0.5, ease: 'easeOut' } }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="ml-2 border-l-[3px] border-black/25 pl-2 font-mono text-[0.7em] font-bold">
              {chip.more}
            </span>
          </motion.span>
        )}
      </AnimatePresence>

      {/* Affordance: a plus that rotates into a close mark once the chip is open. */}
      <motion.span
        aria-hidden
        animate={{ rotate: open ? 135 : 0 }}
        transition={ease}
        className="ml-2 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 border-black
                   font-mono text-[10px] font-black leading-none"
      >
        +
      </motion.span>
    </button>
  );
}
