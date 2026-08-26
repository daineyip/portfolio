'use client';

import type { ReactNode } from 'react';
import { findNode } from '@/data/tree';
import { useHint } from '@/store/useHint';
import { useOpenNode } from './useOpenNode';

/**
 * A prose link that opens a node in the desktop instead of navigating. Available
 * to any .mdx without an import, so a document can point at the rest of the OS —
 * `<Open id="work">Work Experience</Open>` opens the folder the visitor is being
 * told about. An unknown id renders as plain text rather than a dead control.
 *
 * Hovering (or tabbing to) one publishes a hint, and whatever surface holds that
 * node — a desktop icon, a menu — pulses, so the sentence and the thing it names
 * are connected before you click.
 */
export default function OpenLink({ id, children }: { id: string; children?: ReactNode }) {
  const openNode = useOpenNode();
  const setHint = useHint((s) => s.setHint);
  const node = findNode(id);

  if (!node) return <>{children}</>;

  const label = children ?? node.label;
  const point = () => setHint(node.id);
  const clear = () => setHint(null);

  return (
    <button
      type="button"
      onClick={() => {
        clear();
        openNode(node);
      }}
      onPointerEnter={point}
      onPointerLeave={clear}
      onFocus={point}
      onBlur={clear}
      className="font-medium underline decoration-[#ffd23f] decoration-[3px] underline-offset-2 hover:bg-[#ffd23f]"
    >
      {label}
      {node.kind === 'link' && <span className="font-mono text-[11px]"> ↗</span>}
    </button>
  );
}
