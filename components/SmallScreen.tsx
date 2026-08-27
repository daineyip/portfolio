import { Monitor } from 'lucide-react';

/**
 * What a narrow screen gets instead of the desktop.
 *
 * The OS metaphor needs room — draggable windows, an icon field, a taskbar — and
 * Boring Mode, the plain scrolling version of the same content, isn't built yet.
 * Rather than ship a broken desktop to a phone, say so.
 *
 * Purely CSS-gated (`md:hidden` here, `hidden md:contents` on the shell), so it is
 * right in the HTML before any JavaScript runs and cannot mismatch on hydration.
 */
export default function SmallScreen() {
  return (
    <div className="wallpaper fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8 md:hidden">
      <div className="w-full max-w-lg rounded-2xl border-[3px] border-black bg-[#fffdf7] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-[3px] border-black bg-[#ffd23f] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Monitor className="h-6 w-6" strokeWidth={2.5} />
        </span>

        <h1 className="text-3xl font-black leading-tight tracking-tight">
          This one needs a bigger screen.
        </h1>

        <p className="mt-4 text-base leading-relaxed">
          Open it on a laptop, or turn your phone sideways and hope for the best.
        </p>

        <p className="mt-6 inline-block rounded-full border-2 border-black bg-[#f2ede3] px-3 py-1 font-mono text-[11px] font-bold">
          Boring Mode — coming soon
        </p>
      </div>
    </div>
  );
}
