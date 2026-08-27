'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { useDragSnap, type SnapZone } from '@/store/useDragSnap';
import { DESKTOP, SHORTCUTS, findNode, type Node } from '@/data/tree';
import { useHint } from '@/store/useHint';
import { useWindowStore } from '@/store/useWindowStore';
import AppWindow from './AppWindow';
import DesktopIcon from './DesktopIcon';
import IntroCard from './IntroCard';
import AppBody from './apps/AppBody';
import { useOpenNode } from './useOpenNode';

/**
 * The space a dragged window is about to take. Drawn inside the workspace, so it
 * lands exactly where the window will — the same box, from the same rules.
 *
 * It appears only once the pointer has dwelled at an edge, and its appearing is
 * what arms the drop: see store/useDragSnap.ts.
 *
 * Drawn as the *ghost of the window* rather than as a marked-out region — the same
 * radius and the same black border a real window wears, over a pale wash of the
 * paper it will be made of. That is what macOS and Windows both do, and it says
 * "a window goes here" without a dashed hazard box saying it louder.
 */
const OUTLINE: Record<SnapZone, string> = {
  left: 'inset-y-0 left-0 w-1/2',
  right: 'inset-y-0 right-0 w-1/2',
  top: 'inset-0',
};

function SnapOutline() {
  const zone = useDragSnap((s) => s.zone);
  const still = useReducedMotion();

  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: still ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: still ? 1 : 0.98 }}
          transition={{ duration: still ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
          /* Over every window, so the whole claimed region is legible rather than
             half-hidden behind the window being dragged across it. That only works
             because the fill is a pale wash: it frosts what it covers instead of
             hiding it, which is the same reason macOS can put its preview on top. */
          style={{ zIndex: 9999 }}
          /* The blur is barely there on purpose — just enough to sit the wash in
             front of what it covers. Any more and the window under it turns to soup,
             which is the opposite of showing what the space will hold. */
          className={`pointer-events-none absolute rounded-2xl border-[3px] border-black bg-[#fffdf7]/60 backdrop-blur-[0.5px] ${OUTLINE[zone]}`}
        />
      )}
    </AnimatePresence>
  );
}

export default function DesktopWrapper() {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const windows = useWindowStore((s) => s.windows);
  const openNode = useOpenNode();
  const hintId = useHint((s) => s.hintId);
  /*
   * A document pointing at a desktop icon is usually the maximized Home readme,
   * sitting on top of the very icon it names. Ghost the windows while the pointer
   * rests on the link so the pulse underneath is actually visible; menu-bar
   * targets need none of this, since the bar is never covered.
   */
  const peeking = Boolean(hintId && (DESKTOP.includes(hintId) || SHORTCUTS.includes(hintId)));
  /* While peeking, everything on the desktop but the named icon recedes. */
  const dim = (id: string) => (peeking && id !== hintId ? 'opacity-25' : 'opacity-100');

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
          <div key={node.id} className={`transition-opacity duration-200 ${dim(node.id)}`}>
            <DesktopIcon node={node} onOpen={openNode} />
          </div>
        ))}
      </div>

      {/* Deployed sites, pinned down the right edge. */}
      <div className="absolute right-7 top-16 flex w-24 flex-col items-center gap-6">
        {shortcuts.map((node) => (
          <div key={node.id} className={`transition-opacity duration-200 ${dim(node.id)}`}>
            <DesktopIcon node={node} onOpen={openNode} />
          </div>
        ))}
      </div>

      {/*
        The intro sits dead centre, under the windows layer — wallpaper you can poke
        at. The layer is pointer-events-none so the rest of the desktop stays
        clickable; only the card itself takes the pointer back.
      */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center px-8
                    transition-opacity duration-200 ${peeking ? 'opacity-25' : 'opacity-100'}`}
      >
        <div className="pointer-events-auto">
          <IntroCard />
        </div>
      </div>

      {/*
        The workspace is the whole desktop inset by a page margin, and sits below the
        menu bar and above the taskbar. Windows are absolute within it, so dragging
        and Expand share one boundary: windows can be pulled over the icon columns,
        and a maximized window keeps the same left/right padding instead of running
        flush to the screen edges.
      */}
      {/* pointer-events-none so this full-desktop layer doesn't swallow clicks meant
          for the icons beneath it; each window re-enables them for itself. */}
      <div
        ref={workspaceRef}
        className={`pointer-events-none absolute bottom-14 left-7 right-7 top-12 transition-opacity duration-200
                    ${peeking ? 'opacity-20' : 'opacity-100'}`}
      >
        <SnapOutline />

        {/* Closed windows stay mapped so AppWindow's own AnimatePresence can play their exit. */}
        {windows.map((w, i) => (
          <AppWindow
            key={w.id}
            id={w.id}
            title={w.title}
            constraintsRef={workspaceRef}
            /* Opens clear of the left icons; dragging may still cross them. */
            initial={{ x: 120 + i * 26, y: 8 + i * 26 }}
            size={w.appType === 'reader' ? { w: 560, h: 440 } : { w: 660, h: 460 }}
          >
            <AppBody appType={w.appType} />
          </AppWindow>
        ))}
      </div>
    </div>
  );
}
