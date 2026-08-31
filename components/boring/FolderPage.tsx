import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Node } from '@/data/tree';
import { glyphFor, logoFit } from '../NodeIcon';
import Footer from './Footer';
import Prose from './Prose';

/**
 * One folder as one page. The desktop lets you open a company's readme, its demo
 * and its links as separate windows and arrange them; a phone has no arranging, so
 * everything the folder holds is stacked in a single scroll.
 *
 * Order is by kind, not by tree order: the readme first because it is the thing to
 * read, then what there is to look at, then what there is to open elsewhere. The
 * tree orders for the Explorer grid, which is a different question.
 */
const RANK: Record<Node['kind'], number> = {
  doc: 0,
  video: 1,
  image: 2,
  pdf: 3,
  link: 4,
  app: 5,
  folder: 6,
};

export default function FolderPage({ node }: { node: Node }) {
  const children = node.kind === 'folder' ? [...node.children].sort((a, b) => RANK[a.kind] - RANK[b.kind]) : [];

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

      <header className="mb-8 flex items-center gap-4">
        {node.image && (
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl
                       border-[3px] border-black bg-[#fffdf7] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={node.image} alt="" className={`h-full w-full ${logoFit(node)}`} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black leading-tight tracking-tight">{node.label}</h1>
          {node.meta && <p className="font-mono text-xs font-bold opacity-55">{node.meta}</p>}
        </div>
      </header>

      {/* A doc opened directly is its own page — Motivation reaches here that way. */}
      {node.kind === 'doc' && <Prose Body={node.Body} />}

      {children.map((child) => (
        <Item key={child.id} node={child} />
      ))}

      <Footer />
    </div>
  );
}

function Item({ node }: { node: Node }) {
  switch (node.kind) {
    case 'doc':
      return (
        <section className="mb-10">
          <Prose Body={node.Body} />
        </section>
      );

    case 'image':
      return (
        <figure className="mb-8">
          {/* Aspect is unknown up front, so the photo letterboxes inside a fixed box
              rather than the page jumping as each one loads. */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-[3px] border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Image src={node.src} alt={node.alt ?? node.label} fill sizes="100vw" className="object-contain" />
          </div>
          {(node.caption ?? node.alt) && (
            <figcaption className="mt-2 font-mono text-[11px] font-bold leading-snug opacity-55">
              {node.caption ?? node.alt}
            </figcaption>
          )}
        </figure>
      );

    case 'video':
      return (
        <figure className="mb-8">
          {/* Native controls here, unlike the desktop's own transport: on a phone the
              system player is the one that can go fullscreen and pick up the lock
              screen, and it is what a thumb already knows. */}
          <video
            src={node.src}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-xl border-[3px] border-black bg-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          />
        </figure>
      );

    case 'pdf':
    case 'link':
      return <Away node={node} />;

    default:
      return null;
  }
}

/** A row that leaves the page: a document to open, or a site to visit. */
function Away({ node }: { node: Node }) {
  const Glyph = glyphFor(node);
  const href = node.kind === 'pdf' ? node.src : node.kind === 'link' ? node.href : '#';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 flex items-center gap-3 rounded-xl border-[3px] border-black bg-[#fffdf7] px-4 py-3
                 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
    >
      <Glyph className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold">{node.label}</span>
      <span aria-hidden className="font-mono text-xs font-bold opacity-55">
        ↗
      </span>
    </a>
  );
}
