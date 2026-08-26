'use client';

import type { Node } from '@/data/tree';
import { glyphFor } from './NodeIcon';

const FACE: Record<Node['kind'], string> = {
  folder: 'bg-[#ffd23f]',
  doc: 'bg-[#fffdf7]',
  pdf: 'bg-[#fffdf7]',
  app: 'bg-[#fffdf7]',
  link: 'bg-[#fffdf7]',
};

interface Props {
  node: Node;
  onOpen: (node: Node) => void;
  /** 'desk' is the larger treatment used on the wallpaper. */
  size?: 'desk' | 'list';
}

export default function DesktopIcon({ node, onOpen, size = 'desk' }: Props) {
  const Glyph = glyphFor(node);
  /* Square tiles so square logos fill them without cropping. */
  const box = size === 'desk' ? 'h-16 w-16' : 'h-12 w-12';
  const glyph = size === 'desk' ? 'h-7 w-7' : 'h-6 w-6';

  return (
    <button onClick={() => onOpen(node)} className="group flex w-24 flex-col items-center gap-2">
      <span
        className={`relative flex ${box} items-center justify-center overflow-hidden rounded-xl border-[3px] border-black
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:-translate-y-0.5
                    ${FACE[node.kind]}`}
      >
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Glyph className={glyph} strokeWidth={2.5} />
        )}
        {node.kind === 'link' && (
          /* Badged as well as glyphed, so it's clear the link leaves the site. */
          <span className="absolute bottom-0 right-0 rounded-tl-lg border-l-2 border-t-2 border-black bg-[#d94f2b] px-1 font-mono text-[10px] font-bold leading-tight text-[#fffdf7]">
            ↗
          </span>
        )}
      </span>
      <span className="text-center font-mono text-[11px] font-bold leading-tight">{node.label}</span>
    </button>
  );
}
