import Link from 'next/link';

/**
 * Without this, an unknown URL still renders the root layout — so a broken link
 * looked exactly like the homepage, just with a 404 status.
 */
export default function NotFound() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
      <div className="pointer-events-auto w-[400px] overflow-hidden rounded-2xl border-[3px] border-black bg-[#fffdf7] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-black px-3 py-2 font-mono text-[13px] font-bold tracking-wide text-[#fffdf7]">
          ERROR
        </div>
        <div className="p-5">
          <p className="mb-1 font-mono text-sm font-bold">File not found.</p>
          <p className="mb-5 text-sm leading-relaxed text-[#1b1b1b]">
            That address doesn&apos;t exist on this machine. The desktop is at the root.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg border-[3px] border-black bg-[#ffd23f] px-3 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            Back to desktop
          </Link>
        </div>
      </div>
    </div>
  );
}
