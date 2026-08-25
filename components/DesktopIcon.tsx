'use client';

import type { Node } from '@/data/tree';

const FACE: Record<Node['kind'], string> = {
  folder: 'bg-[#ffd23f]',
  doc: 'bg-[#fffdf7]',
  link: 'bg-[#fffdf7]',
};

interface Props {
  node: Node;
  onOpen: (node: Node) => void;
  /** 'desk' is the larger treatment used on the wallpaper. */
  size?: 'desk' | 'list';
}

export default function DesktopIcon({ node, onOpen, size = 'desk' }: Props) {
  const box = size === 'desk' ? 'h-14 w-16' : 'h-12 w-12';

  return (
    <button onClick={() => onOpen(node)} className="flex w-24 flex-col items-center gap-2">
      <span
        className={`relative ${box} border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${FACE[node.kind]}`}
      >
        {node.kind === 'link' && (
          /* Shortcuts are badged so it's clear they leave the site. */
          <span className="absolute -bottom-1 -right-1 border-2 border-black bg-[#d94f2b] px-1 font-mono text-[10px] font-bold leading-tight text-[#fffdf7]">
            ↗
          </span>
        )}
      </span>
      <span className="text-center font-mono text-[11px] font-bold">{node.label}</span>
    </button>
  );
}
