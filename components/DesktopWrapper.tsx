'use client';

import { useRef } from 'react';
import { DESKTOP, findNode, type Node } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import AppWindow from './AppWindow';
import DesktopIcon from './DesktopIcon';
import AppBody from './apps/AppBody';
import { useOpenNode } from './useOpenNode';

export default function DesktopWrapper() {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const windows = useWindowStore((s) => s.windows);
  const openNode = useOpenNode();

  const icons = DESKTOP.map((id) => findNode(id)).filter((n): n is Node => Boolean(n));

  return (
    <div
      ref={constraintsRef}
      className="relative isolate h-screen w-full overflow-hidden bg-[#f2ede3] px-7 pb-16 pt-16
                 [background-image:radial-gradient(#d8cfbe_1.5px,transparent_1.5px)] [background-size:22px_22px]"
    >
      <div className="flex w-24 flex-col items-start gap-6">
        {icons.map((node) => (
          <DesktopIcon key={node.id} node={node} onOpen={openNode} />
        ))}
      </div>

      {/* Every window is a sibling here, constrained to the desktop. Closed windows
          stay mapped so AppWindow's own AnimatePresence can play their exit. */}
      {windows.map((w, i) => (
        <AppWindow
          key={w.id}
          id={w.id}
          title={w.title}
          constraintsRef={constraintsRef}
          /* Absolute children ignore the desktop's padding, so clear the menu
             bar explicitly rather than relying on pt-16. */
          initial={{ x: 180 + i * 26, y: 64 + i * 26 }}
          className={w.appType === 'reader' ? 'w-[560px]' : 'w-[660px]'}
        >
          <AppBody appType={w.appType} />
        </AppWindow>
      ))}
    </div>
  );
}
