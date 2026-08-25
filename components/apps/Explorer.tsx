'use client';

import { childrenOf, pathTo } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import DesktopIcon from '../DesktopIcon';
import { useWindow } from '../WindowContext';
import { useOpenNode } from '../useOpenNode';

const NAV_BUTTON =
  'border-2 border-black bg-[#fffdf7] px-2 font-mono text-xs font-bold disabled:opacity-25';

/** Folder browser. Folders navigate in place here; documents open their own window. */
export default function Explorer() {
  const id = useWindow();
  const nav = useWindowStore((s) => s.windows.find((w) => w.id === id)?.nav);
  const goBack = useWindowStore((s) => s.goBack);
  const goForward = useWindowStore((s) => s.goForward);
  const openNode = useOpenNode();

  if (!nav) return null;

  const current = nav.stack[nav.index];
  const items = childrenOf(current.id);
  // The breadcrumb is the node's real ancestry, not the history stack.
  const trail = pathTo(current.id) ?? [];

  return (
    <div className="flex h-[420px] flex-col">
      <div className="flex items-center gap-2 border-b-[3px] border-black bg-[#f2ede3] px-3 py-2">
        <button className={NAV_BUTTON} disabled={nav.index <= 0} onClick={() => goBack(id)} aria-label="Back">
          ◀
        </button>
        <button
          className={NAV_BUTTON}
          disabled={nav.index >= nav.stack.length - 1}
          onClick={() => goForward(id)}
          aria-label="Forward"
        >
          ▶
        </button>
        <span className="truncate font-mono text-xs font-bold">
          {trail.map((n) => `/${n.label}`).join('')}
        </span>
      </div>

      <div className="grid grid-cols-4 content-start gap-5 overflow-auto p-6">
        {items.length === 0 && <p className="col-span-4 font-mono text-xs opacity-50">Empty folder.</p>}
        {items.map((node) => (
          <DesktopIcon key={node.id} node={node} onOpen={openNode} size="list" />
        ))}
      </div>
    </div>
  );
}
