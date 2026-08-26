'use client';

import { childrenOf, pathTo } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import DesktopIcon from '../DesktopIcon';
import { useWindow } from '../WindowContext';
import { useOpenNode } from '../useOpenNode';

/**
 * Folder browser. Folders navigate in place here; documents open their own window.
 * Navigation is hierarchical: the only chrome is "up one level", derived from the
 * tree, so the arrows can never wander between unrelated desktop roots.
 */
export default function Explorer() {
  const id = useWindow();
  const folderId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.folderId);
  const openFolder = useWindowStore((s) => s.openFolder);
  const openNode = useOpenNode();

  if (!folderId) return null;

  const trail = pathTo(folderId) ?? [];
  const parent = trail[trail.length - 2];
  const items = childrenOf(folderId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b-[3px] border-black bg-[#f2ede3] px-3 py-2">
        <button
          className="rounded-lg border-2 border-black bg-[#fffdf7] px-2 font-mono text-xs font-bold disabled:opacity-25"
          disabled={!parent}
          onClick={() => parent && openFolder({ id: parent.id, label: parent.label })}
          aria-label="Up one level"
          title="Up one level"
        >
          ↑
        </button>

        {/* Breadcrumb segments are the other way back up, and are clickable. */}
        <nav className="flex min-w-0 items-center font-mono text-xs font-bold">
          {trail.map((node, i) => {
            const isCurrent = i === trail.length - 1;
            return (
              <span key={node.id} className="flex min-w-0 items-center">
                <span aria-hidden className="px-0.5 opacity-40">
                  /
                </span>
                {isCurrent ? (
                  <span className="truncate">{node.label}</span>
                ) : (
                  <button
                    className="truncate rounded px-0.5 underline decoration-[#ffd23f] decoration-2 underline-offset-2 hover:bg-[#ffd23f]"
                    onClick={() => openFolder({ id: node.id, label: node.label })}
                  >
                    {node.label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
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
