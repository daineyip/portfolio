'use client';

import type { Node } from '@/data/tree';
import { useHint } from '@/store/useHint';
import { glyphFor, logoFit } from './NodeIcon';

/* A contained logo shows its tile behind it, so that one gets the paper face. */
const FACE: Record<Node['kind'], string> = {
  folder: 'bg-[#ffd23f]',
  doc: 'bg-[#fffdf7]',
  pdf: 'bg-[#fffdf7]',
  video: 'bg-[#fffdf7]',
  image: 'bg-[#fffdf7]',
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
  /* Pulses while a document elsewhere points at this node. */
  const hinted = useHint((s) => s.hintId === node.id);
  /* Square tiles; a logo of any aspect is contained inside one. */
  const box = size === 'desk' ? 'h-14 w-14' : 'h-11 w-11';
  const glyph = size === 'desk' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <button
      onClick={() => onOpen(node)}
      data-cursor={node.kind === 'link' ? 'link' : 'open'}
      className="group flex w-24 flex-col items-center gap-2"
    >
      <span
        className={`relative flex ${box} items-center justify-center overflow-hidden rounded-xl border-[3px] border-black
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:-translate-y-0.5
                    ${node.imageFit === 'contain' ? 'bg-[#fffdf7]' : FACE[node.kind]} ${hinted ? 'hint-tile -translate-y-0.5' : ''}`}
      >
        {node.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.image} alt="" className={`h-full w-full ${logoFit(node)}`} />
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
      <span className="flex flex-col items-center gap-0.5">
        <span
          className={`rounded px-1 text-center font-mono text-[11px] font-bold leading-tight
                      ${hinted ? 'bg-[#ffd23f]' : ''}`}
        >
          {node.label}
        </span>
        {/* The years, where a node carries them — recency without opening the doc. */}
        {node.meta && (
          <span className="px-1 text-center font-mono text-[10px] font-bold leading-tight opacity-55">
            {node.meta}
          </span>
        )}
      </span>
    </button>
  );
}
