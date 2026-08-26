'use client';

import { findNode, pathTo } from '@/data/tree';
import { useWindowStore } from '@/store/useWindowStore';
import { logoFit } from '../NodeIcon';
import { useWindow } from '../WindowContext';

/** Reads its own window off the store via context — no prop drilling. */
export default function ReaderView() {
  const id = useWindow();
  const contentId = useWindowStore((s) => s.windows.find((w) => w.id === id)?.contentId);
  const node = contentId ? findNode(contentId) : undefined;

  if (node?.kind !== 'doc') return null;

  const { Body } = node;

  /*
   * A readme is stamped with the logo of the thing it is about: the doc's own
   * image if it names one, otherwise the nearest ancestor folder's — which is how
   * every company readme gets its logo without the .mdx knowing anything.
   */
  const owner = (pathTo(node.id) ?? []).reverse().find((n) => n.image);

  /* All prose styling comes from mdx-components.tsx, so this is just the frame. */
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#fffdf7]">
      {/* Centred measure so a maximized readme reads like a page, not a stretched file. */}
      <div className="mx-auto w-full max-w-2xl px-6 py-6">
        {/*
          The logo is absolute, and the first heading gets a right margin rather than
          padding — margin shortens the h1's box, so its rule stops at the logo
          instead of running behind it.
        */}
        <div className={`relative ${owner ? '[&>h1:first-child]:mr-20' : ''}`}>
          {owner && (
            <span
              className="absolute right-0 top-0 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl
                         border-[3px] border-black bg-[#fffdf7] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={owner.image} alt={owner.label} className={`h-full w-full ${logoFit(owner)}`} />
            </span>
          )}
          <Body />
        </div>
      </div>
    </div>
  );
}
