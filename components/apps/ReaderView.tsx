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
    <div className="min-h-0 flex-1 overflow-auto bg-[#fffdf7]">
      {/* Centred measure so a maximized readme reads like a page, not a stretched file. */}
      <div className="mx-auto w-full max-w-2xl px-6 py-6">
        <Body />
      </div>
    </div>
  );
}
