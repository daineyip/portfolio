import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Inbox from '@/components/apps/Inbox';
import { CONTACT } from '@/data/tree';
import Footer from './Footer';

/**
 * The compose window as a page, for Boring Mode.
 *
 * It is the **same `Inbox` component** the desktop opens in a window, not a second
 * form — one place collects a message, one place sends it, and the address stays
 * server-side in both. The phone used to get a plain `mailto:` here on the grounds
 * that its mail app composes better; that was true, and it also meant the address
 * had to be printed in the page for the link to work.
 *
 * A fixed height because `Inbox` fills its parent — it was drawn for a window, and
 * a page has no bottom to push against.
 */
export default function MessagePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-6 pt-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#fffdf7]
                   px-3 py-1.5 font-mono text-xs font-bold"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={3} />
        Back
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-black leading-tight tracking-tight">Message me</h1>
        <p className="font-mono text-xs font-bold opacity-55">goes straight to {CONTACT.name}</p>
      </header>

      <div
        className="flex h-[30rem] flex-col overflow-hidden rounded-2xl border-[3px] border-black
                   shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        <Inbox />
      </div>

      <Footer />
    </div>
  );
}
