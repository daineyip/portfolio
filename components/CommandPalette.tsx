'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DESKTOP, TREE, findNode, type Node } from '@/data/tree';
import type { SearchIndex } from '@/lib/search-index';
import { useSearch } from '@/store/useSearch';
import { glyphFor } from './NodeIcon';
import { useOpenNode } from './useOpenNode';

/**
 * Global search, on ⌘K. Everything the desktop holds in one list — folders,
 * documents, links, apps — plus the prose inside the documents, which is otherwise
 * reachable only by opening the right folder and then the right file.
 *
 * Opening a result goes through `useOpenNode()`, the same call the desktop,
 * Explorer and the menu bar make, so a folder still navigates the one Explorer
 * window and a document still gets its own. Search is a way *in*, not a fifth
 * definition of what opening means.
 */

/** A node with the folder trail that leads to it, flattened once at module load. */
interface Entry {
  node: Node;
  path: string;
}

function flatten(nodes: Node[], trail: string[] = [], into: Entry[] = []): Entry[] {
  for (const node of nodes) {
    into.push({ node, path: trail.join(' / ') });
    if (node.kind === 'folder') flatten(node.children, [...trail, node.label], into);
  }
  return into;
}

const ENTRIES = flatten(TREE);

interface Hit extends Entry {
  score: number;
  /** Set only for a match found in the document's text. */
  snippet?: string;
}

const LIMIT = 10;
/*
 * Context around a hit inside a document, deliberately lopsided. The snippet is a
 * single truncated line, and truncation eats the *end* — so lead with just enough
 * to show the match is mid-sentence and let the tail be the part that gets cut.
 * Even context would push the match itself off the edge of the row.
 */
const BEFORE = 24;
const AFTER = 72;

function snippetFor(text: string, at: number, length: number): string {
  const from = Math.max(0, at - BEFORE);
  const to = Math.min(text.length, at + length + AFTER);
  return `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`;
}

/*
 * A label match beats a location match beats something buried in the prose, so
 * typing a folder's name never buries it under the documents that mention it.
 */
function search(query: string, index: SearchIndex): Hit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: Hit[] = [];
  for (const entry of ENTRIES) {
    const label = entry.node.label.toLowerCase();
    let score = 0;
    let snippet: string | undefined;

    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 80;
    else if (label.includes(q)) score = 60;
    else if (entry.path.toLowerCase().includes(q)) score = 40;
    else {
      const body = index[entry.node.id];
      const at = body?.toLowerCase().indexOf(q) ?? -1;
      if (body && at >= 0) {
        score = 20;
        snippet = snippetFor(body, at, q.length);
      }
    }

    if (score) hits.push({ ...entry, score, snippet });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, LIMIT);
}

/**
 * The matched run, lit up — what makes a hit inside prose legible at a glance.
 *
 * Accent yellow on a normal row, paper on the selected one: the selected row is
 * itself accent yellow, and a yellow mark on it would be no mark at all.
 */
function Highlight({ text, query, onAccent }: { text: string; query: string; onAccent?: boolean }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const at = text.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark className={`rounded-sm text-black ${onAccent ? 'bg-[#fffdf7]' : 'bg-[#ffd23f]'}`}>
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
}

export default function CommandPalette({ index }: { index: SearchIndex }) {
  const { isOpen, setOpen } = useSearch();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  /* Whatever had focus before the palette took it, so Escape puts it back. */
  const restoreTo = useRef<Element | null>(null);
  const still = useReducedMotion();
  const openNode = useOpenNode();

  /* An empty query is a starting point, not a blank sheet: offer the desktop roots. */
  const results: Hit[] = useMemo(() => {
    if (query.trim()) return search(query, index);
    return DESKTOP.map((id) => findNode(id))
      .filter((node): node is Node => Boolean(node))
      .map((node) => ({ node, path: '', score: 0 }));
  }, [query, index]);

  useEffect(() => setSelected(0), [query]);

  /* ⌘K from anywhere. preventDefault, or the browser takes it for its own search. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useSearch.getState().isOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!isOpen) return;
    restoreTo.current = document.activeElement;
    setQuery('');
    setSelected(0);
    inputRef.current?.focus();
    return () => {
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus();
    };
  }, [isOpen]);

  /* Keep the keyboard selection in view without scrolling the whole overlay. */
  useEffect(() => {
    document.getElementById(`result-${selected}`)?.scrollIntoView({ block: 'nearest' });
  }, [selected, results.length]);

  const choose = (hit: Hit) => {
    setOpen(false);
    openNode(hit.node);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((i) => (results.length ? (i + 1) % results.length : 0));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    }
    if (e.key === 'Enter' && results[selected]) choose(results[selected]);
  };

  const fade = { duration: still ? 0 : 0.16, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {isOpen && (
        /* Above the menu bar and taskbar (z-10), below the cursor (z-50). */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/25 px-6 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Search"
            initial={{ opacity: 0, y: still ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: still ? 0 : -12 }}
            transition={fade}
            /* The backdrop closes on click; the panel must not pass its own up. */
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            className="w-full max-w-xl overflow-hidden rounded-2xl border-[3px] border-black bg-[#fffdf7] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-3 border-b-[3px] border-black px-4 py-3">
              <Search className="h-4 w-4 shrink-0" strokeWidth={3} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the desktop…"
                aria-label="Search the desktop"
                className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold outline-none placeholder:font-normal placeholder:opacity-40"
              />
              <kbd className="shrink-0 rounded-full border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold opacity-60">
                esc
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 && (
                <p className="px-3 py-6 text-center font-mono text-xs opacity-50">No matches.</p>
              )}

              {results.map((hit, i) => {
                const Glyph = glyphFor(hit.node);
                return (
                  <button
                    key={hit.node.id}
                    id={`result-${i}`}
                    onClick={() => choose(hit)}
                    /* Hover moves the selection too, so mouse and keyboard never
                       disagree about which row Enter would open. */
                    onPointerMove={() => setSelected(i)}
                    data-cursor={hit.node.kind === 'link' ? 'link' : 'open'}
                    className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left ${
                      i === selected ? 'bg-[#ffd23f]' : ''
                    }`}
                  >
                    <Glyph className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-bold">
                          <Highlight text={hit.node.label} query={query} onAccent={i === selected} />
                        </span>
                        {hit.node.kind === 'link' && (
                          <span aria-hidden className="shrink-0 font-mono text-[11px]">
                            ↗
                          </span>
                        )}
                      </span>

                      {hit.snippet && (
                        <span className="mt-0.5 block truncate font-mono text-[11px] opacity-70">
                          <Highlight text={hit.snippet} query={query} onAccent={i === selected} />
                        </span>
                      )}
                    </span>

                    {hit.path && (
                      <span className="shrink-0 self-center font-mono text-[10px] font-bold opacity-45">
                        {hit.path}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
