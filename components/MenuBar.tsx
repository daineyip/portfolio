'use client';

import { useEffect, useRef, useState } from 'react';
import { MENU_BAR, STATUS, STATUS_OPTIONS, findNode, type Node } from '@/data/tree';
import { glyphFor } from './NodeIcon';
import { useOpenNode } from './useOpenNode';

function Clock() {
  const [time, setTime] = useState<string | null>(null);

  // Rendered only after mount: the server has no idea what time it is here.
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  return <span className="font-mono text-xs font-bold tabular-nums">{time ?? '--:--'}</span>;
}

function Status() {
  const status = STATUS_OPTIONS[STATUS];

  return (
    <span className="flex items-center gap-1.5 rounded-full border-2 border-black bg-[#fffdf7] px-2 py-0.5 font-mono text-[11px] font-bold">
      {/* Dot colour is data, not a class — Tailwind can only see static strings. */}
      <span className="relative flex h-2 w-2">
        {status.live && (
          /* A radiating ring reads as "live"; animate-pulse only dims the dot. */
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-80"
            style={{ backgroundColor: status.dot }}
          />
        )}
        <span
          className="relative inline-flex h-2 w-2 rounded-full border border-black"
          style={{ backgroundColor: status.dot }}
        />
      </span>
      {status.label}
    </span>
  );
}

export default function MenuBar() {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const openNode = useOpenNode();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    const onDown = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as globalThis.Node)) setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const choose = (node: Node) => {
    openNode(node);
    setOpen(null);
  };

  return (
    <div
      ref={barRef}
      className="absolute left-0 top-0 z-10 flex w-full items-center gap-1 border-b-[3px] border-black bg-[#fffdf7] px-3 py-1.5"
    >
      {MENU_BAR.map((menu) => {
        const nodes = menu.items.map((id) => findNode(id)).filter((n): n is Node => Boolean(n));
        if (nodes.length === 0) return null;

        // A menu with one destination is a plain button, not a dropdown.
        if (nodes.length === 1) {
          return (
            <button
              key={menu.label}
              onClick={() => choose(nodes[0])}
              className="rounded-lg border-2 border-transparent px-2 py-0.5 font-mono text-xs font-bold hover:border-black hover:bg-[#ffd23f]"
            >
              {menu.label}
            </button>
          );
        }

        const isOpen = open === menu.label;
        return (
          <div key={menu.label} className="relative">
            <button
              onClick={() => setOpen(isOpen ? null : menu.label)}
              className={`rounded-lg border-2 px-2 py-0.5 font-mono text-xs font-bold ${
                isOpen ? 'border-black bg-[#ffd23f]' : 'border-transparent hover:border-black hover:bg-[#ffd23f]'
              }`}
            >
              {menu.label}
            </button>

            {isOpen && (
              <div className="absolute left-0 top-full mt-1 min-w-44 overflow-hidden rounded-xl border-[3px] border-black bg-[#fffdf7] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {nodes.map((node) => {
                  const Glyph = glyphFor(node);
                  return (
                    <button
                      key={node.id}
                      onClick={() => choose(node)}
                      className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left font-mono text-xs hover:bg-[#ffd23f]"
                    >
                      <span className="flex items-center gap-2">
                        <Glyph className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                        {node.label}
                      </span>
                      {node.kind === 'link' && <span aria-hidden>↗</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="ml-auto flex items-center gap-3">
        <Status />
        <Clock />
      </div>
    </div>
  );
}
