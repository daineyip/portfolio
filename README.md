# Portfolio OS — skeleton

Neo-brutalist desktop-metaphor portfolio. Next.js App Router + Tailwind v4 + Zustand + Framer Motion.

```bash
npm install
npm run dev
```

## What's here
- `store/useWindowStore.ts` — window metadata (isOpen, isMinimized, zIndex). Opening an existing id restores + focuses instead of duplicating. Drag coordinates stay local to each window.
- `data/content.ts` — sample text keyed by `contentId`.
- `components/AppWindow.tsx` — draggable window; the title bar is the only drag handle (`useDragControls`), constrained to whatever `constraintsRef` you pass. Owns its own `AnimatePresence` so closing/minimising plays an exit animation.
- `components/apps/Explorer.tsx` — icon grid **and** a nested `AppWindow` constrained to its own body ref: a draggable window inside a window, rendering store data.
- `components/apps/ReaderView.tsx` — resolves its own window via `useWindow()` context, no prop drilling.
- `app/layout.tsx` — hosts the shell so navigation never unmounts the OS.

## Not built yet
Resizing, Boring Mode (<768px plain scrolling page), full desktop icon set.
