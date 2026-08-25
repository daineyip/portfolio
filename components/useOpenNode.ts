'use client';

import { useCallback } from 'react';
import type { Node } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';

/**
 * The single definition of what opening a node means, shared by the desktop,
 * Explorer and the menu bar: folders navigate in place, documents get their own
 * window, links leave the site.
 */
export function useOpenNode() {
  const openWindow = useWindowStore((s) => s.openWindow);
  const openFolder = useWindowStore((s) => s.openFolder);

  return useCallback(
    (node: Node) => {
      switch (node.kind) {
        case 'folder':
          openFolder({ id: node.id, label: node.label });
          break;
        case 'doc':
          openWindow(`reader:${node.id}`, node.label, 'reader', node.id);
          break;
        case 'link':
          window.open(node.href, '_blank', 'noopener,noreferrer');
          break;
      }
    },
    [openWindow, openFolder],
  );
}
