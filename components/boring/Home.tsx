import { Flame } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { BIO, MOBILE_SECTIONS, childrenOf, findNode, type Node } from '@/data/tree';
import Footer from './Footer';
import MobileIntro from './MobileIntro';
import Prose from './Prose';
import Tile from './Tile';

/**
 * Boring Mode's front page: the intro, then who I am, then the three directories
 * the desktop keeps as folders. One column, scrolled — no windows, no store.
 */
export default function Home() {
  const bio = findNode('identity-bio');
  const motivation = findNode('identity-motivation');

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-8">
      <section className="mb-12">
        <MobileIntro />
      </section>

      {/* The bio sits under the intro rather than behind a menu: on the desktop it is
          a window you go and open, and here there is nowhere to open it to. */}
      <section className="mb-12 rounded-2xl border-[3px] border-black bg-[#fffdf7] p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-4 flex items-center gap-4">
          <Image
            src={BIO.photo}
            alt={BIO.name}
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 rounded-xl border-[3px] border-black object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight tracking-tight">{BIO.name}</h2>
            <p className="font-mono text-xs font-bold opacity-70">{BIO.role}</p>
            <p className="font-mono text-xs font-bold opacity-55">{BIO.location}</p>
          </div>
        </div>

        {bio?.kind === 'doc' && <Prose Body={bio.Body} />}

        {/* The only way to Motivation — it is a longer read than this page wants. */}
        {motivation && (
          <Link
            href={`/${motivation.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-[#ffd23f]
                       px-3 py-1.5 font-mono text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                       active:translate-y-0.5"
          >
            <Flame className="h-3.5 w-3.5" strokeWidth={2.5} />
            Why I build — {motivation.label}
          </Link>
        )}
      </section>

      {MOBILE_SECTIONS.map((id) => {
        const section = findNode(id);
        const items = childrenOf(id).filter((n): n is Node => n.kind === 'folder');
        if (!section || items.length === 0) return null;

        return (
          <section key={id} className="mb-12">
            <h2 className="mb-4 font-mono text-sm font-bold uppercase tracking-[0.2em] opacity-55">
              {section.label}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {items.map((item) => (
                <Tile key={item.id} node={item} />
              ))}
            </div>
          </section>
        );
      })}

      <Footer />
    </div>
  );
}
