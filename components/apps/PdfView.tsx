'use client';

import { findNode } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { useWindow } from '../WindowContext';

/** Renders a PDF from public/ in the browser's own viewer. */
export default function PdfView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  if (node?.kind !== 'pdf') return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b-[3px] border-black bg-[#f2ede3] px-3 py-2">
        <span className="truncate font-mono text-xs font-bold">{node.src}</span>
        <a
          href={node.src}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border-2 border-black bg-[#ffd23f] px-2 py-0.5 font-mono text-[11px] font-bold"
        >
          Open in new tab ↗
        </a>
      </div>
      {/* The browser's native PDF viewer does the rendering — no dependency needed. */}
      <iframe src={node.src} title={node.label} className="min-h-0 w-full flex-1 bg-white" />
    </div>
  );
}
