'use client';

import { useRef } from 'react';
import { DESKTOP, GREETING, SHORTCUTS, findNode, type Node } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import AppWindow from './AppWindow';
import DesktopIcon from './DesktopIcon';
import AppBody from './apps/AppBody';
import { useOpenNode } from './useOpenNode';

export default function DesktopWrapper() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const windows = useWindowStore((s) => s.windows);
  const openNode = useOpenNode();

  const resolve = (ids: string[]) => ids.map((id) => findNode(id)).filter((n): n is Node => Boolean(n));
  const icons = resolve(DESKTOP);
  const shortcuts = resolve(SHORTCUTS);

  return (
    <div className="wallpaper relative isolate h-screen w-full overflow-hidden px-7 pb-16 pt-16">
      {/* Hard-edged colour blocks: flat fills, black borders, no gradients. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="absolute -right-24 top-[45%] h-64 w-64 rotate-12 rounded-[2rem] border-[3px] border-black bg-[#ffd23f]" />
        <span className="absolute -left-24 bottom-28 h-56 w-56 -rotate-6 rounded-[2rem] border-[3px] border-black bg-[#d94f2b]" />
        <span className="absolute left-[38%] top-6 h-24 w-24 rotate-3 rounded-2xl border-[3px] border-black bg-[#35c46a]" />
        <span className="absolute bottom-24 left-[30%] h-14 w-44 -rotate-2 rounded-2xl border-[3px] border-black bg-black" />
      </div>

      <div className="relative flex w-24 flex-col items-start gap-6">
        {icons.map((node) => (
          <DesktopIcon key={node.id} node={node} onOpen={openNode} />
        ))}
      </div>

      {/* Deployed sites, pinned down the right edge. */}
      <div className="absolute right-7 top-16 flex w-24 flex-col items-center gap-6">
        {shortcuts.map((node) => (
          <DesktopIcon key={node.id} node={node} onOpen={openNode} />
        ))}
      </div>

      {/* Wallpaper greeting. Not interactive, so clicks fall through to the desktop. */}
      <p className="pointer-events-none absolute bottom-24 right-10 max-w-md text-right text-4xl font-black leading-[1.1] tracking-tight text-black">
        {GREETING.before}{' '}
        <span className="inline-block -rotate-1 rounded-xl border-[3px] border-black bg-[#ffd23f] px-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {GREETING.name}
        </span>{' '}
        {GREETING.after}
      </p>

      {/*
        The workspace is the whole desktop inset by a page margin, and sits below the
        menu bar and above the taskbar. Windows are absolute within it, so dragging
        and Expand share one boundary: windows can be pulled over the icon columns,
        and a maximized window keeps the same left/right padding instead of running
        flush to the screen edges.
      */}
      {/* pointer-events-none so this full-desktop layer doesn't swallow clicks meant
          for the icons beneath it; each window re-enables them for itself. */}
      <div ref={workspaceRef} className="pointer-events-none absolute bottom-14 left-7 right-7 top-12">
        {/* Closed windows stay mapped so AppWindow's own AnimatePresence can play their exit. */}
        {windows.map((w, i) => (
          <AppWindow
            key={w.id}
            id={w.id}
            title={w.title}
            constraintsRef={workspaceRef}
            /* Opens clear of the left icons; dragging may still cross them. */
            initial={{ x: 120 + i * 26, y: 8 + i * 26 }}
            className={w.appType === 'reader' ? 'h-[440px] w-[560px]' : 'h-[460px] w-[660px]'}
          >
            <AppBody appType={w.appType} />
          </AppWindow>
        ))}
      </div>
    </div>
  );
}
