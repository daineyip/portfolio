'use client';

import { findNode } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { useWindow } from '../WindowContext';

/** Reads its own window off the store via context — no prop drilling. */
export default function ReaderView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  if (node?.kind !== 'doc') return null;

  const { Body } = node;

  /* All prose styling comes from mdx-components.tsx, so this is just the frame. */
  return (
    <div className="max-h-[420px] overflow-auto border-t-[3px] border-black bg-[#fffdf7] p-5">
      <Body />
    </div>
  );
}
