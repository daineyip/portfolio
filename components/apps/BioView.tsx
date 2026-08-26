'use client';

import Image from 'next/image';
import { BIO, findNode } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { useWindow } from '../WindowContext';

/**
 * The bio gets its own designed frame — a hero with the photo top right, then the
 * prose from bio.mdx. Everything below the header is styled by mdx-components.
 */
export default function BioView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  if (node?.kind !== 'doc') return null;

  const { Body } = node;

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#fffdf7]">
      <div className="mx-auto w-full max-w-3xl px-8 py-10">
        {/* Wraps rather than using media queries: the window is resizable and its
            width has nothing to do with the viewport's. */}
        <header className="flex flex-wrap-reverse items-end justify-between gap-8">
          <div className="min-w-[15rem] flex-1">
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight">{BIO.name}</h1>
            <p className="mt-3 font-mono text-sm font-bold">{BIO.role}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-black bg-[#ffd23f] px-3 py-1 font-mono text-[11px] font-bold">
              {BIO.location}
            </span>
          </div>

          <div className="relative h-64 w-48 shrink-0 overflow-hidden rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {/* next/image resizes and re-encodes on demand, so the full-size
                original never reaches the browser. */}
            <Image src={BIO.photo} alt={BIO.name} fill sizes="192px" className="object-cover" priority />
          </div>
        </header>

        <hr className="my-8 border-t-[3px] border-black" />

        <Body />
      </div>
    </div>
  );
}
