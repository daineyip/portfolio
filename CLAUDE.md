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
decorative `pointer-events-none` layer in `DesktopWrapper`, plus the `GREETING`
from `data/tree.ts` set large in the lower right.

## Reference tech stack (for handoff/dev intent)
- Next.js App Router; `app/layout.tsx` persistently hosts `<DesktopWrapper>` + `<Taskbar>` so navigation never unmounts the OS.
- Tailwind CSS; Framer Motion (`motion.div` + `useDragControls`) for local 60fps X/Y drag physics; Zustand for global window state; Lucide React icons.
- Content is MDX, compiled by `@next/mdx`. All prose styling lives in `mdx-components.tsx` at the repo root, so `.mdx` files carry no classes. That file also supplies `<Signature>` and `<Open id="node-id">`, usable in any `.mdx` without an
import — `<Open>` opens a tree node in the desktop (folder, doc, link or app) instead
of navigating, so a document can point at the rest of the OS.

The `home` node is a `doc`, not a folder: it opens maximized as the read-me-first
page that says where everything else lives.

## Hover-to-locate (`useHint`)
Hovering or focusing an `<Open>` link publishes the node id to `useHint`, a tiny
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

Folder convention for an experience (a company, a project): a `readme.mdx` with
`fullscreen: true` carrying the rundown, and alongside it external links, media
and documents about that work — product sites, Figma files, photos, PDFs. Docs are **static** MDX imports (a variable-path
`import()` is unreliable under Turbopack). Prose lives in `content/`, mirroring the
tree. No frontmatter: labels and ordering are TypeScript, so `label` is free to
differ from the filename. `useOpenNode()` is the single definition of what opening
a node means, shared by desktop, Explorer and menu bar.

## Components
- **DesktopWrapper** — root client component; wallpaper, desktop icons from the `DESKTOP` surface. Windows live in a **workspace** div (`top-12 bottom-14 left-7 right-7`) — the whole desktop inset by a page margin, below the menu bar and above the taskbar. That div is `constraintsRef`, so dragging and Expand share one boundary: windows can be dragged over the icon columns, and a maximized window covers them while keeping the page margin. Windows open at `x: 120` so they start clear of the left icons. Renders **every** window as a sibling. Carries `isolate`, which keeps window z-indexes from ever climbing over the menu bar and taskbar.
- **MenuBar** — fixed top bar built from `MENU_BAR`; a menu with a single item renders as a plain button rather than a dropdown. Closes on Escape and outside-click.
- **DesktopIcon** — one icon button used on both the wallpaper and in Explorer's grid; `link` nodes get an `↗` badge.
- **NodeIcon** — maps a node's `icon?: IconKey` to a glyph, falling back per kind (folder/doc/link). Icons are **content**: every node names its own in `data/tree.ts`, so the registry is the only place components know about glyphs. Lucide v1 dropped brand icons, so GitHub and LinkedIn are hand-rolled fill marks in `components/icons.tsx`.
- **AppWindow** — `motion.div drag dragConstraints={constraintsRef} dragMomentum={false}`, `style={{ zIndex }}`; drag is started only by the title bar (`useDragControls` + `dragListener={false}`), or double-click it to maximize. Chrome is three traffic-light circles, left to right: green expand, yellow minimize, red close. Maximized windows use `inset-0` and fill the **workspace**, never the screen. Position is owned by explicit `useMotionValue` x/y rather than Framer's internal drag transform: maximizing zeroes them (otherwise the window fills from wherever it was dragged and spills past the right edge) and restoring puts the saved offset back. Do not try to neutralise the translate in CSS — `[transform:none!important]` is not valid Tailwind v4 and compiles to nothing. The window is `flex flex-col` and templates fill it with `min-h-0 flex-1`, which is what makes Expand meaningful. Owns its own `<AnimatePresence>` so close/minimize plays an exit animation — the motion element must stay AnimatePresence's direct child. Inner contents wrapped in a `WindowContext.Provider` (value: window id) so nested components use `useWindow()` instead of prop-drilling; chrome = `cursor-grab` title bar with title + minimize/close.
- **Taskbar** — fixed `absolute bottom-0 w-full`, iterates store windows; clicking a focused item minimizes it, otherwise restores + focuses.

## Responsive: "Boring Mode"
Under 768px, bypass the desktop metaphor and window store entirely — render a plain vertically scrolling page with the same data in basic sections (`hidden md:flex` for the OS, or a `useMediaQuery` hook).

## Build order
1. window store → 2. DesktopWrapper/Taskbar/DesktopIcon → 3. AppWindow drag + z-index focus with mock data → 4. WindowProvider context → 5. the app templates + MenuBar → 6. neo-brutalist styling pass → 7. Boring Mode.
