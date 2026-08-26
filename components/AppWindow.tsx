'use client';

import { AnimatePresence, motion, useDragControls, useMotionValue } from 'framer-motion';
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { useWindowStore } from '@/store/useWindowStore';
import { WindowProvider } from './WindowContext';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  /** Element the window may not be dragged outside of. */
  constraintsRef: RefObject<HTMLElement | null>;
  initial?: { x: number; y: number };
  className?: string;
}

const LIGHT = 'h-3.5 w-3.5 rounded-full border-2 border-black transition-transform hover:scale-110';

export default function AppWindow({
  id,
  title,
  children,
  constraintsRef,
  initial = { x: 0, y: 0 },
  className = 'h-[460px] w-[660px]',
}: Props) {
  const win = useWindowStore((s) => s.windows.find((w) => w.id === id));
  const { focusWindow, minimizeWindow, closeWindow, toggleMaximize } = useWindowStore();
  const controls = useDragControls();

  const maximized = win?.isMaximized ?? false;

  /*
    Position is owned here rather than left to Framer's internal drag transform.
    Dragging writes into these motion values, so maximizing has to zero them or the
    window would fill the workspace *starting* from wherever it was dragged to and
    spill past the right edge. Restoring puts the saved offset back.
  */
  const x = useMotionValue(initial.x);
  const y = useMotionValue(initial.y);
  const restoreTo = useRef({ x: initial.x, y: initial.y });

  useEffect(() => {
    if (maximized) {
      restoreTo.current = { x: x.get(), y: y.get() };
      x.set(0);
      y.set(0);
    } else {
      x.set(restoreTo.current.x);
      y.set(restoreTo.current.y);
    }
  }, [maximized, x, y]);

  /* AnimatePresence lives here rather than at the call site: the window mounts
     and unmounts on store state, so this is the only place that boundary is
     crossed. Returning null instead would skip the exit animation entirely. */
  return (
    <AnimatePresence>
      {win && win.isOpen && !win.isMinimized && (
        <motion.div
          key={id}
          drag={!maximized}
          dragControls={controls}
          dragListener={false} /* only the title bar starts a drag */
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ x, y, zIndex: win.zIndex }}
          onMouseDown={() => focusWindow(id)}
          className={`pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-[#fffdf7] ${
            maximized
              ? /* Fills the workspace: over the icon columns, but keeping the page
                   margin at each edge and clear of the menu bar and taskbar. */
                'inset-0 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
              : `left-0 top-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`
          }`}
        >
          <div
            onPointerDown={(e) => !maximized && controls.start(e)}
            onDoubleClick={() => toggleMaximize(id)}
            className={`flex shrink-0 select-none items-center justify-between gap-3 bg-black px-3 py-2 ${
              maximized ? '' : 'cursor-grab touch-none active:cursor-grabbing'
            }`}
          >
            <span className="truncate font-mono text-[13px] font-bold tracking-wide text-[#fffdf7]">
              {title}
            </span>
            <div className="flex shrink-0 items-center gap-2">
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
