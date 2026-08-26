'use client';

import { useWindowStore } from '@/store/useWindowStore';

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow } = useWindowStore();
  const open = windows.filter((w) => w.isOpen);

  /*
    Fixed height rather than vertical padding: with `py-2` the bar was text-height
    when empty and button-height once a window opened, so it grew as tabs appeared.
    Buttons never shrink and the row scrolls sideways, so many windows can't change
    the height either.
  */
  return (
    <div className="absolute bottom-0 z-10 flex h-11 w-full items-center gap-2 overflow-x-auto border-t-[3px] border-black bg-black px-3">
      <span className="shrink-0 pr-2 font-mono text-xs font-bold text-[#ffd23f]">START</span>
      {open.map((w) => (
        <button
          key={w.id}
          onClick={() => (w.isMinimized ? focusWindow(w.id) : minimizeWindow(w.id))}
          className={`shrink-0 whitespace-nowrap rounded-lg border-2 px-3 py-1 font-mono text-xs font-bold ${
            w.isMinimized ? 'border-[#fffdf7] bg-transparent text-[#fffdf7]' : 'border-[#fffdf7] bg-[#fffdf7] text-black'
          }`}
        >
          {w.title}
        </button>
      ))}
    </div>
  );
}
