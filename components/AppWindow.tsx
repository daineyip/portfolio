'use client';

import { AnimatePresence, motion, useDragControls, useMotionValue, type PanInfo } from 'framer-motion';
import { PinIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useDragSnap, type SnapZone } from '@/store/useDragSnap';
import { useWindowStore } from '@/store/useWindowStore';
import { WindowProvider } from './WindowContext';

/** How close to a workspace edge the pointer must be for that edge to arm. */
const EDGE = 56;
/**
 * How long the pointer must stay in a zone before that zone offers itself, per
 * zone — following macOS, where the side tiles answer at once and filling the
 * screen asks you to hold.
 *
 * The sides can be instant because they are cheap: a window pinned to a half you
 * did not want is dragged straight back out. The top is the expensive one — it is
 * also the edge you cross on the way to anywhere near the menu bar — so it waits.
 */
const DWELL: Record<SnapZone, number> = { left: 0, right: 0, top: 500 };

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  /** Element the window may not be dragged outside of. */
  constraintsRef: RefObject<HTMLElement | null>;
  initial?: { x: number; y: number };
  /**
   * The size this window takes when it is floating, as numbers rather than a
   * Tailwind class: tearing a pinned window loose has to know the size it is about
   * to become *before* it becomes it, and a class string cannot be asked.
   */
  size?: { w: number; h: number };
}

/*
 * At 14px these are the smallest targets in the OS, so they grow to meet the
 * pointer in two ways.
 *
 * Visibly: the cluster swells as a whole once the pointer reaches it — its own
 * hover, which a light's hover bubbles into, so the gaps between them count too —
 * and the one actually under the pointer swells again on top of that. The two
 * scales sit on different elements, the row and the button, so neither has to win a
 * specificity fight with the other.
 *
 * Invisibly: `before` stretches each button's hit area past the dot it draws —
 * taller than the bar's padding and exactly wide enough to meet its neighbours,
 * never overlapping them — so the target is bigger than it looks without moving
 * anything or leaving a dead gap between the lights.
 */
const LIGHT =
  'relative h-3.5 w-3.5 rounded-full border-2 border-black transition-transform duration-200 ' +
  "hover:scale-125 before:absolute before:-inset-x-1 before:-inset-y-2 before:content-['']";

export default function AppWindow({
  id,
  title,
  children,
  constraintsRef,
  initial = { x: 0, y: 0 },
  size = { w: 660, h: 460 },
}: Props) {
  const win = useWindowStore((s) => s.windows.find((w) => w.id === id));
  const { focusWindow, minimizeWindow, closeWindow, toggleMaximize, snapWindow, unpinWindow } =
    useWindowStore();
  const controls = useDragControls();
  const setZone = useDragSnap((s) => s.setZone);
  const frame = useRef<HTMLDivElement>(null);

  const maximized = win?.isMaximized ?? false;
  const snap = win?.snap;
  /* Both states park the window against the workspace edges rather than letting it
     float, so both need its drag offset out of the way. */
  const pinned = maximized || Boolean(snap);

  /*
    Position is owned here rather than left to Framer's internal drag transform.
    Dragging writes into these motion values, so pinning has to zero them or the
    window would fill its half *starting* from wherever it was dragged to and spill
    past the edge. Letting go of the pin puts the saved offset back.
  */
  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);
  const restoreTo = useRef({ x: initial.x, y: initial.y });
  const wasPinned = useRef(false);

  /* Set when a drag is what unpinned the window, so the effect below leaves the
     position alone: the tear-off has already put it where the hand is. */
  const tornOff = useRef(false);

  useLayoutEffect(() => {
    /* Only the crossing matters. Saving on every pinned render would overwrite the
       stored offset with the zeroes we just wrote — and going maximized → half is
       one such crossing, which is how the floating position used to get lost. */
    if (pinned && !wasPinned.current) {
      restoreTo.current = { x: x.get(), y: y.get() };
      x.set(0);
      y.set(0);
    } else if (!pinned && wasPinned.current && !tornOff.current) {
      x.set(restoreTo.current.x);
      y.set(restoreTo.current.y);
    }
    if (!pinned) tornOff.current = false;
    wasPinned.current = pinned;
  }, [pinned, x, y]);

  /**
   * Tear a pinned window loose, *before* the drag begins.
   *
   * A pinned window sits where CSS puts it with x/y at zero, so Framer captures
   * zero as the drag origin and then writes `x = origin + delta` on every move —
   * which drops the window at the workspace's left edge no matter where it was.
   * Setting x/y mid-drag cannot fix that; Framer overwrites it on the next frame.
   * The position has to be right *before* `controls.start`.
   *
   * Keeping the window's top-left is not enough either: a maximized window's
   * top-left already **is** the workspace's, so it would shrink into the far corner
   * away from a hand that grabbed the middle of the bar. What has to survive is the
   * grab — where along the title bar the pointer took hold — which is a fraction of
   * the old width applied to the new one. That is why the floating size is a prop
   * and not a class: the new width has to be known here, a frame before the window
   * is that wide.
   */
  const startDrag = (e: React.PointerEvent) => {
    if (pinned && frame.current && constraintsRef.current) {
      const box = frame.current.getBoundingClientRect();
      const area = constraintsRef.current.getBoundingClientRect();
      /* Where the hand took hold: across as a fraction, down as a plain offset,
         since the title bar is the same height whatever size the window is. */
      const across = box.width ? (e.clientX - box.left) / box.width : 0.5;
      const down = e.clientY - box.top;

      x.set(e.clientX - area.left - size.w * across);
      y.set(e.clientY - area.top - down);
      tornOff.current = true;
      unpinWindow(id);
    }
    controls.start(e);
  };

  /*
   * Edge zones, armed by dwelling rather than by touching. The pointer crosses an
   * edge constantly while a window is being moved; only staying there means it.
   */
  const dwelling = useRef<SnapZone | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const consider = (zone: SnapZone | null) => {
    if (zone === dwelling.current) return;
    dwelling.current = zone;
    if (timer.current) clearTimeout(timer.current);
    /* Leaving a zone withdraws the offer at once — only arriving can be slow. */
    setZone(null);
    if (!zone) return;

    const wait = DWELL[zone];
    /* A zero wait is answered now, not on the next tick: `setTimeout(fn, 0)` still
       costs a frame, which is exactly the hesitation this is meant not to have. */
    if (wait === 0) setZone(zone);
    else timer.current = setTimeout(() => setZone(zone), wait);
  };

  const onDrag = (_: unknown, info: PanInfo) => {
    const area = constraintsRef.current?.getBoundingClientRect();
    if (!area) return;
    const { x: px, y: py } = info.point;
    /* Top wins the corners: it is the bigger commitment of the two. */
    consider(
      py - area.top < EDGE
        ? 'top'
        : px - area.left < EDGE
          ? 'left'
          : area.right - px < EDGE
            ? 'right'
            : null,
    );
  };

  const onDragEnd = () => {
    if (timer.current) clearTimeout(timer.current);
    /* The armed zone, not the one under the pointer: an outline that never appeared
       is an intent the visitor never signalled. */
    const armed = useDragSnap.getState().zone;
    dwelling.current = null;
    setZone(null);
    if (armed === 'top') toggleMaximize(id);
    else if (armed) snapWindow(id, armed);
  };

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  /* AnimatePresence lives here rather than at the call site: the window mounts
     and unmounts on store state, so this is the only place that boundary is
     crossed. Returning null instead would skip the exit animation entirely. */
  return (
    <AnimatePresence>
      {win && win.isOpen && !win.isMinimized && (
        <motion.div
          key={id}
          ref={frame}
          /* Pinned windows drag too — that is how they are torn loose. */
          drag
          dragControls={controls}
          dragListener={false} /* only the title bar starts a drag */
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ x, y, zIndex: win.zIndex, ...(pinned ? null : { width: size.w, height: size.h }) }}
          onMouseDown={() => focusWindow(id)}
          className={`pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-[#fffdf7] ${
            maximized
              ? /* Fills the workspace: over the icon columns, but keeping the page
                   margin at each edge and clear of the menu bar and taskbar. */
                'inset-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
              : snap
                ? /* Half the workspace, full height, against one edge — the same
                     boundary a maximized window fills and a drag is held inside. */
                  `inset-y-0 w-1/2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                    snap === 'left' ? 'left-0' : 'right-0'
                  }`
                : 'left-0 top-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
          }`}
        >
          <div
            onPointerDown={startDrag}
            onDoubleClick={() => toggleMaximize(id)}
            data-cursor="drag"
            className="flex shrink-0 cursor-grab select-none touch-none items-center justify-between gap-3 bg-black px-3 py-2 active:cursor-grabbing"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-[#fffdf7]">
              {/* Matches the marker on this window's taskbar tab. The bar is the one
                  place that can say why it has stopped answering to a drag. */}
              {snap && (
                <PinIcon
                  className="h-3 w-3 shrink-0"
                  strokeWidth={2.5}
                  aria-label={`Pinned ${snap}`}
                />
              )}
              <span className="truncate font-mono text-[13px] font-bold tracking-wide">{title}</span>
            </span>
            <div className="flex shrink-0 origin-right items-center gap-2 transition-transform duration-200 hover:scale-125">
              <button
                aria-label={maximized ? 'Restore' : 'Expand'}
                title={maximized ? 'Restore' : 'Expand'}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => toggleMaximize(id)}
                className={`${LIGHT} bg-[#35c46a]`}
              />
              <button
                aria-label="Minimize"
                title="Minimize"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => minimizeWindow(id)}
                className={`${LIGHT} bg-[#ffd23f]`}
              />
              <button
                aria-label="Close"
                title="Close"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => closeWindow(id)}
                className={`${LIGHT} bg-[#d94f2b]`}
              />
            </div>
          </div>

          <WindowProvider value={id}>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </WindowProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
