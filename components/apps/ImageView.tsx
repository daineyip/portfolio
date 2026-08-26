'use client';

import Image from 'next/image';
import { findNode } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { useWindow } from '../WindowContext';

/**
 * A photo from public/ in the desktop's own frame: matted on the desk colour,
 * bordered and shadowed like every other surface here. next/image resizes and
 * re-encodes on demand, so the multi-megabyte original never reaches a browser.
 */
export default function ImageView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  if (node?.kind !== 'image') return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#f2ede3]">
      <div className="relative min-h-0 flex-1 p-4">
        {/* `fill` + contain lets the photo letterbox inside whatever size the
            window is dragged to, without knowing its aspect up front. */}
        <Image
          src={node.src}
          alt={node.alt ?? node.label}
          fill
          sizes="(max-width: 768px) 100vw, 70vw"
          className="rounded-xl border-[3px] border-black bg-black object-contain
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>

      {node.caption && (
        <p className="shrink-0 border-t-[3px] border-black bg-[#fffdf7] px-4 py-2 text-center font-mono text-[11px] font-bold leading-snug">
          {node.caption}
        </p>
      )}
    </div>
  );
}
