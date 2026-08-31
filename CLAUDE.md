# Project context — OS-Style Portfolio

Standing design spec supplied by the user. Apply to all designs in this project.

## Concept
Personal portfolio that mimics a desktop OS: wallpaper, folder icons, taskbar, draggable/resizable windows.

## Visual style
Neo-brutalist, softened: bold black borders (`border-[3px]`), high contrast, flat
colors, hard drop shadows (`shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`), clean modern
typography — but **rounded**, not sharp. Radii: `rounded-2xl` windows and dropdowns,
`rounded-xl` icons and code/media blocks, `rounded-lg` buttons, `rounded-full`
pills and window controls. Palette lives in `app/globals.css`: `--paper`, `--desk`,
`--accent` yellow, `--alert` red, `--ok` green. The desktop uses the `.wallpaper`
class — a flat fill under a hard dot grid, **no gradients** — with high-contrast
colour blocks (flat fills, `border-[3px]` black, rotated, rounded) composed as a
decorative `pointer-events-none` layer in `DesktopWrapper`, plus the `IntroCard`
centred on the desktop.

## Reference tech stack (for handoff/dev intent)
- Next.js App Router; `app/layout.tsx` persistently hosts `<DesktopWrapper>` + `<Taskbar>` so navigation never unmounts the OS.
- Tailwind CSS; Framer Motion (`motion.div` + `useDragControls`) for local 60fps X/Y drag physics; Zustand for global window state; Lucide React icons.
- Content is MDX, compiled by `@next/mdx`. All prose styling lives in `mdx-components.tsx` at the repo root, so `.mdx` files carry no classes. That file also supplies `<Signature>` and `<Open id="node-id">`, usable in any `.mdx` without an
import — `<Open>` opens a tree node in the desktop (folder, doc, link or app) instead
of navigating, so a document can point at the rest of the OS.

The `home` node is a `doc`, not a folder: it opens maximized as the read-me-first
page that says where everything else lives.

## Hover-to-locate (`useHint`)
Hovering or focusing an `<Open>` link publishes a node id to `useHint`, a tiny
store separate from `useWindowStore` — this is transient pointer feedback, not
window state, and it churns on every mouseover. Whatever surface holds that node
answers: `DesktopIcon` pulses (`.hint-tile` in `globals.css`, a radiating `--alert`
ring that keeps the hard drop shadow), `MenuBar` lights the menu the item lives
under (`.hint-ring`), and `DesktopWrapper` ghosts the whole windows layer to
`opacity-20` when the target is a desktop icon — otherwise the maximized readme
covers the very icon it is pointing at — while fading every *other* icon and
shortcut to `opacity-25`, so one tile is left lit on a cleared desktop. Menu-bar targets skip the ghosting, since
the bar is never covered. Both pulses fall back to a static ring under
`prefers-reduced-motion`.

**What gets published is `hintFor(id)`, not the id itself** (`data/tree.ts`). The
three surfaces above answer a narrow set of ids — `DESKTOP`, `SHORTCUTS`, and the
menu bar's items — so a hint naming anything else highlights nothing at all.
`hintFor` walks up from the node to the nearest ancestor a surface holds: a link to
`work-binance`, two levels inside a folder, pulses the **Work Experience** icon
that holds it. The home readme happens to link only top-level ids, so it never
needed this and is unchanged by it; the assistant names whatever answers the
question, which is usually deeper, and that is what made the gap visible. It lives
in `data/tree.ts` beside `pathTo` rather than with the chat code, because
`OpenLink` needs it too and must not import the assistant's context module — that
would drag every document's text into the client bundle.

## State: `useWindowStore` (Zustand)
```ts
export type AppType = 'explorer' | 'reader' | 'pdf' | 'bio' | 'inbox';

export interface AppWindow {
  id: string;          // 'explorer' | 'reader' | 'resume' ...
  title: string;
  appType: AppType;    // which template renders inside
  contentId?: string;  // e.g. 'project-1' for reader
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface WindowState {
  windows: AppWindow[];
  openWindow: (id, title, appType, contentId?) => void;
  openFolder: (entry: NavEntry) => void;   // repoints the one Explorer window
  closeWindow: (id) => void;
  minimizeWindow: (id) => void;
  toggleMaximize: (id) => void;
  focusWindow: (id) => void;   // raise z-index
}
```
Explorer windows also carry `folderId` — folders navigate **in place** in the single
`EXPLORER_ID` window, documents each open their own window keyed `reader:<docId>`.

Navigation is **hierarchical, not historical**: the window stores only the folder it
is showing, and "up one level" is derived from the tree via `pathTo`. Do not
reintroduce a back/forward history — desktop roots share the one Explorer window, so
a history stack lets the arrows walk sideways between unrelated roots (Work
Experience → Projects → ~ → Trash), which is not what folder chrome means.

Rules: `openWindow` on an already-open id does NOT duplicate — set `isMinimized: false` and focus.
Store holds metadata only (z-index, minimized); X/Y coordinates stay local to the window for perf.
`closeWindow` only flips `isOpen` — closed windows stay in the array so `AppWindow`'s
`AnimatePresence` can play their exit.

## App Template pattern
`<AppBody appType>` is the switch; a window renders whichever template its `appType` names:
- `<Explorer>` — an "up one level" button + clickable breadcrumb over a grid of child icons.
- `<ReaderView>` — resolves its doc node and renders the node's MDX `Body` in a centred measure.
- `<BioView>` — the bio's own designed frame: hero with name, role, location pill and photo top right, then the MDX prose beneath.
- `<PdfView>` — renders a PDF from `public/` in the browser's native viewer via an `iframe`; no dependency.
- `<Inbox>` — a compose window styled as a mail client (To / From / Reply to / Subject / body). Send builds a `mailto:` and hands off to the visitor's mail app, so there is no backend and no secret; swapping `send()` for a POST is the only change needed to use a form service.

A `doc` node may set `app: 'bio'` to render with a template other than the reader.
Photos go through `next/image`, which resizes and re-encodes on demand — the 7.6MB
original never reaches the browser, and EXIF rotation is applied correctly.

## Content
`data/tree.ts` holds one `Node` tree (`folder` | `doc` | `link`) plus the surfaces
that reference nodes **by id** — `DESKTOP` (left column), `SHORTCUTS` (right column,
deployed sites), `MENU_BAR` — so a node can appear twice without duplicating content.
A node may carry `image: '/logo.png'` instead of an `icon` key; the image wins.
A doc may set `fullscreen: true` to open **maximized** — used for readmes, which
are documents to read rather than files to peek at.

The documents' text is extracted at **build time**, once, by
`scripts/build-content.mjs` — it strips every `.mdx` under `content/` to plain text
and writes `lib/content-text.json`, keyed by path under `content/`. It runs from the
`predev` and `prebuild` npm scripts, so `npm run dev` and `npm run build` are the
only commands anyone has to know; the JSON is generated but committed, so a fresh
clone type-checks before either has run.

Two things consume it and neither can reach the disk, which is the whole reason it
exists: `lib/search-index.ts` maps those paths onto node ids for the palette
(`app/layout.tsx` hands the result over as a prop), and the chat endpoint runs on
the edge, where `node:fs` does not exist. Nothing outside the script touches the
filesystem, so `search-index.ts` is now importable from anywhere. **The stripping
rules live in the script and nowhere else** — a second copy is how the search
snippets and the assistant start disagreeing about what a document says.

Because a compiled `Body` cannot be read back as text, each doc node names its own path
under `content/` in a `file` field. A doc without one still matches on its label.

Folder convention for an experience (a company, a project): a `readme.mdx` with
`fullscreen: true` carrying the rundown, and alongside it external links, media
and documents about that work — product sites, Figma files, photos, PDFs. Docs are **static** MDX imports (a variable-path
`import()` is unreliable under Turbopack). Prose lives in `content/`, mirroring the
tree. No frontmatter: labels and ordering are TypeScript, so `label` is free to
differ from the filename. `useOpenNode()` is the single definition of what opening
a node means, shared by desktop, Explorer and menu bar.

## The assistant (`app/api/chat/route.ts`)

An edge function that answers questions about the work and **points at where the
answer lives on the desktop**. `POST /api/chat` takes
`{ messages: [{ role, content }] }` and streams SSE back: `text` deltas, `hint`
events, then `done` — or `error`.

The answers are deliberately **one short sentence**, because the highlight is
carrying the other half of the message. The prompt's Voice section is the dial:
the tag says *where*, so the words only have to say *what*, and an answer that
describes a folder path in prose is one that has forgotten the icon is already
pulsing. `MAX_COMPLETION_TOKENS` is a backstop under that, not the mechanism.

Its context is assembled from `data/tree.ts` itself in `lib/portfolio-context.ts`,
so the brief and the desktop cannot drift — adding a company folder puts it in
front of the model on the next deploy, under the id the desktop actually uses. It
comes in two halves and the split is the point. The **catalog** — every node's id,
kind, label, path and surface — always ships, because it is what lets the model
point anywhere; it can name a folder it was given no prose for, which is how a
question about the resume reaches a PDF. The **prose** is chosen per question by
`documentsFor`, scored per term over label, path and body.

Sending all sixteen documents cost ~9.6k tokens a message and overran Groq's
free-tier 8k-per-minute ceiling outright. Per-question selection put it near 4k.
Retrieval here is a budget decision before it is a quality one — but it is both,
since a 27B model loses the thread in sixteen documents faster than in three.

**Hints are read out of the prose, not sent alongside it.** The model points at
things by writing `<Open id="…">label</Open>` — the same tag the `.mdx` files use —
and the route scans the stream for completed tags, emitting a `hint` the moment one
appears. One channel, so they cannot disagree: the icon starts pulsing while the
sentence naming it is still being typed, and the client renders the tag as a real
`OpenLink`, which makes hover behave exactly as it does in the home readme, for
free. A hallucinated id costs a link and nothing more — `OpenLink` already renders
an unknown id as plain text, and the route drops it from the hints.

**A hint is resolved to something on screen before it is sent** (`hintFor`). The
hint surfaces answer a narrow set of ids: `DesktopIcon` pulses when the id is its
own, `DesktopWrapper` clears the desktop only for a `DESKTOP` or `SHORTCUTS` id,
`MenuBar` lights the menu holding it. The home readme links only such ids, which is
why its hints work; the assistant names whatever answers the question, and
`work-binance` — two levels inside a folder — would highlight nothing at all. So a
hint carries `node` (what was named) and `id` (its nearest ancestor a surface
holds, which is what `useHint` gets). An answer about Binance pulses **Work
Experience**, the icon the visitor can actually see and click. Hints dedupe on `id`,
since two documents in one folder are one place to look.

Note `useHint` holds **one id at a time**, so a client must not replay a whole
answer's hints into it in sequence — that flickers and lands on the last. Hover
stays the model, as on the home page; the events are for leading the visitor
*before* they hover.

The provider is configuration, not code. The route speaks the OpenAI-compatible
`/chat/completions` shape over plain `fetch` — no vendor SDK, so the edge bundle
carries no client library — which every cheap host of open models answers: Groq,
Together, OpenRouter, DeepInfra, Fireworks, a local Ollama. `CHAT_API_KEY`,
`CHAT_BASE_URL` and `CHAT_MODEL` pick one; the default is Qwen3.8 27B on Groq.
Slugs differ per host for the same weights and hosts retire them, so `CHAT_MODEL`
is checked against `GET {CHAT_BASE_URL}/models`, never assumed — a 404
`model_not_found` in the server log is what a stale one looks like.

Qwen3 is a reasoning model, and nothing here needs it: the answer is in the
excerpts, and the job is to restate it and attach the right ids. `reasoning_effort`
turns it off — fewer tokens billed, a faster first word, and no chain of thought to
leak. Allowed values are per-model (the qwen3 family takes `none`, gpt-oss would
400 on it), so it is `CHAT_REASONING_EFFORT`, and an empty string omits the
parameter for a provider that has never heard of it.

The route still **filters `<think></think>` out of the stream**, holding back a few
characters so a tag split across two chunks is still caught. That is deliberate
belt-and-braces: the parameter is honoured by only some models, and when it is
ignored the thinking arrives inline. The filter is what keeps a wrong env var a
config mistake instead of a visitor reading the model's notes to itself.

Guards: same-origin when an `Origin` header is present, a turn cap, a per-message
length cap, and a 503 when the key is missing. There is deliberately **no rate
limiter** — an edge function has no shared memory to keep counts in, so that
belongs in front of the route (Vercel WAF, or Upstash keyed by IP) before this
serves anything but a portfolio.

## Components
- **CommandPalette** — global search on ⌘K, plus a search field in the menu bar so the feature is findable without knowing the shortcut. Searches node labels, folder paths **and the prose inside the documents**; ranking is label-exact → label-prefix → label-contains → path → body, so typing a folder's name never buries it under the documents that mention it. A body hit renders a snippet with the match lit in accent yellow — paper yellow on the selected row, which is itself accent. Opening a result goes through `useOpenNode()`, the same call the desktop, Explorer and the menu bar make: search is a way *in*, not a fifth definition of what opening means. Overlay sits at `z-40`, above the menu bar and taskbar (`z-10`) and below `Cursor` (`z-50`). Open/closed state is `store/useSearch.ts`, its own store for the same reason as `useHint`: the palette is not a window and must not churn window state.
- **Cursor** — replaces the pointer with a circle, black ringed in paper (`HALO`) so it stays visible over black chrome as well as the pale desktop, that reads what it is over: a small glyph inside it says what the click does (`+` to open, `↗` to leave the site, a move mark on a drag handle), a hollow ring marks a plain button — an intro chip included, since expanding one is a press like any other, and a caret bar marks a text field. It deliberately stays close to pointer-sized — a cursor that swells into a label is a cursor that covers the thing you are pointing at, and with the native pointer hidden there is no arrow tip left to aim with. Where a target is too small to aim at, the fix belongs to the target, not the cursor: the traffic lights grow to meet the pointer (see **AppWindow**). What it becomes is decided in two passes — `data-cursor` wins where a component knows something the DOM cannot say (a `DesktopIcon`, an `OpenLink` and a `MenuBar` item *inside* a menu each know whether the node behind them is a link or something that opens in the desktop, while the bar's own top-level buttons stay plain chrome; a title bar knows it is a drag handle), and everything else falls back to what the element *is* (`input`, `a[href]`, `button`), so ordinary controls need no annotation. Shapes are a table of **fixed** widths and heights animated as numbers — no layout measuring, no transform scaling, so `rounded-full` ends stay round at every size between. Three guards: it only activates on `(pointer: fine)`, and it adds `.no-native-cursor` from script rather than markup, so no-JS and touch visitors keep a real cursor; and it hides over an `<iframe>` (the PDF viewer), whose pointer events never reach the page.
- **IntroCard** — the wallpaper intro, centred on the desktop: three lines from `INTRO` in `data/tree.ts`, each a fragment of text ending in a chip (role, city, current company) that expands in place to a longer clause. Wallpaper you can poke at — not a window, no store; the layer holding it is `pointer-events-none` so the rest of the desktop stays clickable, and it recedes with the icons while `peeking`. Two rules keep the motion smooth, and both are structural: **one chip per line, every line `whitespace-nowrap`**, so an opening chip only widens its own line and the text never rewraps (a rewrap is a jump no animation can smooth over); and **no Framer `layout` anywhere in it** — layout animation moves a box by projecting a transform, and the radius correction can't hold a `rounded-full` pill together while the box scales, so the ends pop between radii. The chip instead animates the real width of its clause, which is a genuine layout change: no transform, no distortion, and the centred line slides continuously around it. Timing is one long ease-out (`DURATION`/`EASE` at the top of the file), collapsing to zero under `prefers-reduced-motion`.
- **Assistant** — the chat panel in the bottom-right corner of the wallpaper, and
  the front end for `/api/chat`. Deliberately **not** a window and so deliberately
  not in `useWindowStore`: no title bar, never in the taskbar, can't be dragged or
  snapped, and it collapses to a circular bubble rather than minimizing to a tab —
  the same reasoning that keeps the command palette out (see `store/useSearch.ts`).
  The thread is its own state and the component stays mounted while collapsed, so
  shrinking hides the conversation without losing it. Rendered as a sibling of
  `DesktopWrapper`, not inside it: the wrapper carries `isolate`, and anything in
  there is trapped under the menu bar and taskbar. Sits at `z-30` — over the
  windows, under the palette (`z-40`) and `Cursor` (`z-50`).
  The answer's `<Open>` tags are parsed into real `OpenLink`s, which is the whole
  trick: hovering one in a chat answer pulses the icon holding it exactly as
  hovering one in the Home readme does, because it is the identical component
  talking to the identical store. Nothing about hover-to-locate was rebuilt. The
  parser is a parser rather than a regex replace because the text arrives a
  character at a time — a half-written tag must not show as markup, and an
  unclosed one renders its label as plain text until it closes, so a link appears
  once, finished, instead of flickering into being mid-word.
  The stream's `hint` events do the part hover cannot: leading someone who does not
  yet know there is anything to hover. When an answer lands, the **first** place it
  points at pulses on its own for `LEAD_MS` and then lets go — one id, because
  `useHint` holds one at a time and replaying the list would flicker through it.
  The duration is long enough to be followed rather than merely noticed: the
  visitor reads the sentence first and only then looks up. Hovering any link takes
  the pulse over before it elapses, so the lead is a suggestion and the pointer
  outranks it. The input uses `autoFocus`, not an effect keyed on open —
  `AnimatePresence` is `mode="wait"`, so the panel does not mount until the bubble
  has finished exiting and an effect firing on the state change finds a null ref.
- **DesktopWrapper** — root client component; wallpaper, desktop icons from the `DESKTOP` surface. Windows live in a **workspace** div (`top-12 bottom-14 left-7 right-7`) — the whole desktop inset by a page margin, below the menu bar and above the taskbar. That div is `constraintsRef`, so dragging and Expand share one boundary: windows can be dragged over the icon columns, and a maximized window covers them while keeping the page margin. Windows open at `x: 120` so they start clear of the left icons. Renders **every** window as a sibling. Carries `isolate`, which keeps window z-indexes from ever climbing over the menu bar and taskbar. Desktop layers are stated as z-index, bottom to top: colour blocks `z-0`, `IntroCard` `z-10`, icon columns `z-20`, workspace `z-30`. Left to source order the intro painted over the icons — it is wallpaper, and wallpaper must not cover the things you click.
- **MenuBar** — fixed top bar built from `MENU_BAR`; a menu with a single item renders as a plain button rather than a dropdown. Closes on Escape and outside-click.
- **DesktopIcon** — one icon button used on both the wallpaper and in Explorer's grid; `link` nodes get an `↗` badge.
- **NodeIcon** — maps a node's `icon?: IconKey` to a glyph, falling back per kind (folder/doc/link). Icons are **content**: every node names its own in `data/tree.ts`, so the registry is the only place components know about glyphs. Lucide v1 dropped brand icons, so GitHub and LinkedIn are hand-rolled fill marks in `components/icons.tsx`.
- **AppWindow** — `motion.div drag dragConstraints={constraintsRef} dragMomentum={false}`, `style={{ zIndex }}`; drag is started only by the title bar (`useDragControls` + `dragListener={false}`), or double-click it to maximize. Chrome is three traffic-light circles, left to right: green expand, yellow minimize, red close. At 14px they are the smallest targets in the OS, so they grow to meet the pointer: the cluster swells `origin-right` once the pointer reaches the lights themselves — its own hover, which a light's hover bubbles into, so the gaps between them count while the rest of the title bar does not — and the one under the pointer swells again on top of that (two scales on two different elements, so neither has to out-specify the other), and a `before` pseudo-element stretches each hit area past the drawn dot — taller than the bar's padding, and exactly wide enough to meet its neighbours without overlapping them, so the target is bigger than it looks with no dead gaps and nothing moved. Maximized windows use `inset-0` and fill the **workspace**, never the screen. Position is owned by explicit `useMotionValue` x/y rather than Framer's internal drag transform: maximizing zeroes them (otherwise the window fills from wherever it was dragged and spills past the right edge) and restoring puts the saved offset back. Do not try to neutralise the translate in CSS — `[transform:none!important]` is not valid Tailwind v4 and compiles to nothing. The window is `flex flex-col` and templates fill it with `min-h-0 flex-1`, which is what makes Expand meaningful. Owns its own `<AnimatePresence>` so close/minimize plays an exit animation — the motion element must stay AnimatePresence's direct child. Inner contents wrapped in a `WindowContext.Provider` (value: window id) so nested components use `useWindow()` instead of prop-drilling; chrome = `cursor-grab` title bar with title + minimize/close.
- **Taskbar** — fixed `absolute bottom-0 w-full`, iterates store windows; clicking a focused item minimizes it, otherwise restores + focuses. A pinned window's tab carries a pin glyph before its title, minimized or not — the window itself can't say it is pinned while it is off screen. The window's own title bar carries the same glyph, so the marker reads the same in both places.

## Keyboard shortcuts
`components/Shortcuts.tsx` binds them; `content/system/shortcuts.mdx` explains them.
The native chords are unavailable — ⌘W closes the browser tab, ⌘M minimizes the
browser, and a page cannot intercept either — so window management sits on **⌃⌥**,
the one modifier pair no browser claims and the one Rectangle and Magnet already
bind for tiling. Directions follow Windows: `⌃⌥←/→` pin to a half (the same side
again lets the window float free), `⌃⌥↑` expands or restores, `⌃⌥↓` minimizes,
`⌃⌥W` closes, `⌃⌥Tab` cycles, `⌃⌥D` shows the desktop. All but the last act on the
**front window**, the highest z-index that is open and not minimized.

The list of them is a **document in the OS**, not a bespoke overlay: `shortcuts.mdx`
sits in the About This Desktop folder with the other system docs, opens in a window
like anything else, and its text is indexed by search along with every other
document. `?` opens it. So the component holds the behaviour and the document holds
the explanation, and neither restates the other — which also means adding a shortcut
means editing both.

Chords are matched on **`e.code`, never `e.key`**. Holding Option on macOS rewrites
the character a key produces — ⌥W arrives as `∑`, ⌥D as `∂` — so matching on `key`
appears to work (the arrow names never change) while every letter silently fails.
`code` is the physical key and is untouched by modifiers.

Handlers bail out when the event target is an input, textarea or contenteditable,
and while the search palette is open: typing is typing, not commanding.

Windows can also be **dragged** to the same three places — left and right halves,
top to fill — when the pointer reaches an edge of the workspace (`EDGE`/`DWELL` in
`AppWindow`). Following macOS, the dwell is **per zone**: the sides answer at once,
the top asks you to hold. The sides can be instant because they are cheap to undo —
a window pinned to a half you did not want is dragged straight back out — while the
top is both the expensive move and the edge you cross on the way to the menu bar.
Leaving a zone withdraws the offer immediately; only arriving can be slow.

The outline that appears is drawn by `SnapOutline` in `DesktopWrapper`, inside the
workspace, from the same rules the window will use — so it shows the actual box. It
is styled as the **ghost of the window**, the way macOS does it: the same
`rounded-2xl` and the same solid black border a real window wears, over a pale wash
of the paper it will be made of. Not a dashed region — that reads as a hazard box
rather than as a window about to arrive. It paints **over** every window
(`zIndex: 9999`) so the whole claimed region is legible instead of half-hidden
behind the window being dragged across it; that only works because the wash is pale
and the blur behind it is a token half-pixel, so what it covers still reads.
It carries **no z-index**, which puts it under every window: painted on top, its
fill tints the window being dragged and reads as the window changing colour. Its
appearance is also what **arms** the drop — `onDragEnd` acts on the zone in
`useDragSnap`, never the one under the pointer, so releasing without an outline
does nothing. What you can see is the only thing that can happen.

Dragging a pinned or maximized window tears it loose, and the conversion has to
happen in `startDrag` **before** `controls.start()`, not in `onDragStart`. A pinned
window sits where CSS puts it with x/y at zero, so Framer captures zero as the drag
origin and then writes `x = origin + delta` on every move — dropping the window at
the workspace's left edge wherever it actually was. Setting x/y mid-drag cannot fix
it; Framer overwrites the value on the next frame. So `startDrag` places the window
first and calls `controls.start()` last, so the origin Framer captures is a position
that makes sense.

Where it places it is the **grab**, not the corner. Keeping the window's top-left
works for a half-pinned window and fails for a maximized one, whose top-left already
*is* the workspace's — it would shrink into the far corner away from a hand that
took hold of the middle of the bar. So the pointer's fraction across the old width
is applied to the new one. That is why a window's floating size is a `size={{ w, h }}`
prop rather than a Tailwind class: the new width has to be known a frame before the
window is that wide. Every window is `drag`-enabled, and the title bar always offers
the grab cursor.

Pinning is `snap?: 'left' | 'right'` on the window, mutually exclusive with
`isMaximized`. `AppWindow` treats maximized and snapped as one state, `pinned` —
both park the window against the workspace edges, so both zero its drag offset and
both disable dragging. The offset is saved and restored **only on the crossing**
into and out of pinned; saving on every pinned render would overwrite the stored
position with the zeroes just written, which is how maximized → half loses it.

## Responsive: "Boring Mode"
Under 768px the desktop metaphor is bypassed entirely — no windows, no window
store, no cursor chrome — and the same content is served as ordinary pages.

The gate is **pure CSS**: `hidden md:contents` on the shell in `app/layout.tsx`,
`md:hidden` on each page. So it is correct in the HTML before any script runs and
cannot mismatch on hydration. `display: contents` rather than a real box, so the
shell's absolutely positioned parts still resolve against `<body>`. The body only
locks to the viewport at `md` and up (`md:h-screen md:overflow-hidden`); below that
the page has to scroll.

Boring Mode **is** the routes, which is why `{children}` renders outside the gate:
- `app/page.tsx` → `components/boring/Home.tsx`: the intro, then the bio, then the
  three folders named by `MOBILE_SECTIONS` as grids of tiles.
- `app/[node]/page.tsx` → `FolderPage`: one folder as one scroll — its readme, then
  its media, then what leaves the site. Ordered by kind, not by tree order, since
  the tree orders for the Explorer grid. Only folders and docs get a page; a link
  leaves and a PDF opens in the browser's own viewer.

Two things do not survive the trip from the desktop and are rebuilt rather than
reused. `<Open id="...">` means "open a window", which is meaningless here, so
`Prose` passes a `components` override to the compiled MDX that turns it into a
`Link` (or an outbound `<a>`) — the global provider is untouched. And `IntroCard`
expands its chips sideways, which does not fit 390px, so `MobileIntro` drops the
clause below the line instead.

`Cursor` renders **outside** that gate, as a sibling of both: a narrow window on a
desktop is still a desktop. It has to be outside rather than width-gated —
`display: none` does not unmount, so inside the gate it would be hidden while its
effect still stripped the native cursor, leaving that screen with no pointer.

## Build order
1. window store → 2. DesktopWrapper/Taskbar/DesktopIcon → 3. AppWindow drag + z-index focus with mock data → 4. WindowProvider context → 5. the app templates + MenuBar → 6. neo-brutalist styling pass → 7. Boring Mode.
