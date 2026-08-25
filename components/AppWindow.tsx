'use client';

import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import type { ReactNode, RefObject } from 'react';
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
  minimizable?: boolean;
}

export default function AppWindow({
  id,
  title,
  children,
  constraintsRef,
  initial = { x: 0, y: 0 },
  className = 'w-[660px]',
  minimizable = true,
}: Props) {
  const win = useWindowStore((s) => s.windows.find((w) => w.id === id));
  const { focusWindow, minimizeWindow, closeWindow } = useWindowStore();
  const controls = useDragControls();

  /* AnimatePresence lives here rather than at the call site: the window mounts
     and unmounts on store state, so this is the only place that boundary is
     crossed. Returning null instead would skip the exit animation entirely. */
  return (
    <AnimatePresence>
      {win && win.isOpen && !win.isMinimized && (
        <motion.div
          key={id}
          drag
          dragControls={controls}
          dragListener={false} /* only the title bar starts a drag */
          dragConstraints={constraintsRef}
          dragElastic={0}
          dragMomentum={false}
          initial={{ x: initial.x, y: initial.y, opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ zIndex: win.zIndex }}
          onMouseDown={() => focusWindow(id)}
          className={`absolute left-0 top-0 border-[3px] border-black bg-[#fffdf7] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}
        >
          <div
            onPointerDown={(e) => controls.start(e)}
            className="flex cursor-grab touch-none select-none items-center justify-between gap-3 bg-black px-3 py-2 active:cursor-grabbing"
          >
            <span className="font-mono text-[13px] font-bold tracking-wide text-[#fffdf7]">{title}</span>
            <div className="flex gap-2">
              {minimizable && (
                <button
                  aria-label="Minimize"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => minimizeWindow(id)}
                  className="h-5 w-5 border-2 border-[#fffdf7] bg-[#ffd23f]"
                />
              )}
              <button
                aria-label="Close"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => closeWindow(id)}
                className="h-5 w-5 border-2 border-[#fffdf7] bg-[#d94f2b]"
              />
            </div>
          </div>

          <WindowProvider value={id}>{children}</WindowProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
