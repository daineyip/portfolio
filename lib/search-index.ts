import { TREE, type Node } from '@/data/tree';
import CONTENT_TEXT from './content-text.json';

/**
 * Plain text of every document, keyed by node id, so global search can look inside
 * the readmes rather than only at their labels.
 *
 * The text itself is produced at build time by scripts/build-content.mjs and lands
 * in content-text.json keyed by path under `content/`; this module only maps those
 * paths onto node ids. Nothing here touches the disk, so — unlike the earlier
 * `node:fs` version — it is safe to import from anywhere, the edge chat endpoint
 * included. app/layout.tsx still calls it on the server so the palette receives
 * plain data as a prop.
 *
 * A doc node's `Body` is a compiled component and cannot be read back as text, so
 * each doc names its own `file` under `content/`; see data/tree.ts.
 */
const TEXT = CONTENT_TEXT as Record<string, string>;

function walk(nodes: Node[], into: Record<string, string>) {
  for (const node of nodes) {
    if (node.kind === 'folder') walk(node.children, into);
    if (!node.file) continue;
    /* A doc naming a file that isn't there keeps its label and loses its full
       text — it should cost that document its prose, not the whole build. */
    const text = TEXT[node.file];
    if (text) into[node.id] = text;
  }
  return into;
}

export type SearchIndex = Record<string, string>;

export function buildSearchIndex(): SearchIndex {
  return walk(TREE, {});
}
