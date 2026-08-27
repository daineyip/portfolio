import { readFileSync } from 'node:fs';
import path from 'node:path';
import { TREE, type Node } from '@/data/tree';

/**
 * Plain text of every document, keyed by node id, so global search can look inside
 * the readmes rather than only at their labels.
 *
 * Built on the **server**, at build time: the route is statically prerendered, so
 * this runs once during `next build` and ships as a prop, costing the visitor
 * nothing at runtime. `app/layout.tsx` is the only place allowed to import this —
 * it reaches for `node:fs`, which breaks any client bundle that pulls it in.
 *
 * A doc node's `Body` is a compiled component and cannot be read back as text, so
 * each doc names its own `file` under `content/`; see data/tree.ts.
 */
const CONTENT = path.join(process.cwd(), 'content');

/*
 * MDX to plain text, in the order the rules have to run.
 *
 * Deliberately regex rather than a real MDX parser: the corpus is 15 files and
 * ~28KB, the output is only ever matched against and shown as a snippet, and a
 * parser would be a dependency and a build step to maintain for no gain in either.
 * The one rule that matters is that JSX keeps its *inner text* — `<Open id="work">
 * Work Experience</Open>` has to remain findable as "Work Experience".
 */
const STRIP: Array<[RegExp, string]> = [
  [/```[\s\S]*?```/g, ' '], // fenced code
  [/^import .*$/gm, ' '], // MDX imports
  [/<[^>]+>/g, ' '], // JSX tags, keeping what sat between them
  [/!\[([^\]]*)\]\([^)]*\)/g, '$1'], // images, keeping alt text
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'], // links, keeping the label
  [/^[>\s]*[-*+]\s+/gm, ' '], // bullets
  [/[#*_`~|]/g, ' '], // leftover markdown punctuation
  [/&[a-z]+;/gi, ' '], // entities
  [/\s+/g, ' '], // collapse
];

function toText(mdx: string): string {
  return STRIP.reduce((text, [pattern, to]) => text.replace(pattern, to), mdx).trim();
}

function walk(nodes: Node[], into: Record<string, string>) {
  for (const node of nodes) {
    if (node.kind === 'folder') walk(node.children, into);
    if (!node.file) continue;
    try {
      into[node.id] = toText(readFileSync(path.join(CONTENT, node.file), 'utf8'));
    } catch {
      /* A doc naming a file that isn't there should cost it its full text, not the
         whole build — it still matches on its label. */
    }
  }
  return into;
}

export type SearchIndex = Record<string, string>;

export function buildSearchIndex(): SearchIndex {
  return walk(TREE, {});
}
