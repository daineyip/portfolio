/**
 * Every .mdx under content/, stripped to plain text, written to
 * lib/content-text.json keyed by its path under content/.
 *
 * Run it by hand after editing anything under content/: `npm run content`. It also
 * runs from `prebuild`, which is not redundant with that — it is the guard against
 * the hand-run being forgotten, since a stale file means a search index and an
 * assistant that have not read the edit, shipped without a symptom. It is ~70ms.
 *
 * The output is committed, because nothing generates it on install any more and a
 * fresh clone has to type-check and run `next dev` before anyone has built.
 *
 * Why a build step rather than reading the files where they are needed: the two
 * things that want this text can't reach the disk. Global search hands it to a
 * client component, and the chat endpoint runs on the edge, where node:fs does
 * not exist. A JSON module is importable from both, costs the visitor a static
 * import, and keeps one definition of "what the prose says".
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const OUT = path.join(ROOT, 'lib', 'content-text.json');

/*
 * MDX to plain text, in the order the rules have to run.
 *
 * Deliberately regex rather than a real MDX parser: the corpus is a handful of
 * files, the output is only ever matched against, shown as a search snippet or
 * read by a model, and a parser would be a dependency and a build step to
 * maintain for no gain in either. The one rule that matters is that JSX keeps
 * its *inner text* — `<Open id="work">Work Experience</Open>` has to remain
 * findable as "Work Experience".
 */
const STRIP = [
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

function toText(mdx) {
  return STRIP.reduce((text, [pattern, to]) => text.replace(pattern, to), mdx).trim();
}

/** Every .mdx under dir, as paths relative to content/, sorted for a stable file. */
function walk(dir, into = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, into);
    else if (entry.name.endsWith('.mdx')) into.push(path.relative(CONTENT, full));
  }
  return into;
}

const text = {};
for (const file of walk(CONTENT)) {
  // Posix separators, so the keys match the `file` fields in data/tree.ts on any OS.
  text[file.split(path.sep).join('/')] = toText(readFileSync(path.join(CONTENT, file), 'utf8'));
}

writeFileSync(OUT, `${JSON.stringify(text, null, 2)}\n`);
console.log(`content: ${Object.keys(text).length} documents → ${path.relative(ROOT, OUT)}`);
