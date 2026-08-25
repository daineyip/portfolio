'use client';

import { useWindowStore } from '@/store/useWindowStore';

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow } = useWindowStore();
  const open = windows.filter((w) => w.isOpen);

  return (
    <div className="absolute bottom-0 z-10 flex w-full items-center gap-2 border-t-[3px] border-black bg-black px-3 py-2">
      <span className="pr-2 font-mono text-xs font-bold text-[#ffd23f]">START</span>
      {open.map((w) => (
        <button
          key={w.id}
          onClick={() => (w.isMinimized ? focusWindow(w.id) : minimizeWindow(w.id))}
          className={`border-2 px-3 py-1 font-mono text-xs font-bold ${
            w.isMinimized ? 'border-[#fffdf7] bg-transparent text-[#fffdf7]' : 'border-[#fffdf7] bg-[#fffdf7] text-black'
          }`}
        >
          {w.title}
        </button>
      ))}
    </div>
  );
}
