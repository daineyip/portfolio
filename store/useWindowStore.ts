import { create } from 'zustand';

export type AppType = 'explorer' | 'reader';

/** One entry in an Explorer window's navigation history. */
export interface NavEntry {
  id: string;
  label: string;
}

export interface AppWindow {
  id: string;
  title: string;
  appType: AppType;
  contentId?: string;
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  /** Explorer windows only: where they are and how they got there. */
  nav?: { stack: NavEntry[]; index: number };
}

interface WindowState {
  windows: AppWindow[];
  top: number;
  openWindow: (id: string, title: string, appType: AppType, contentId?: string) => void;
  openFolder: (entry: NavEntry) => void;
  goBack: (id: string) => void;
  goForward: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
}

/**
 * Folders navigate in place inside this one window; documents each get their own.
 * Reader windows are keyed `reader:<docId>`, so openWindow's dedupe-by-id already
 * gives exactly one window per document.
 */
export const EXPLORER_ID = 'explorer';

export const useWindowStore = create<WindowState>((set) => ({
  windows: [],
  top: 0,

  // Never duplicates: an already-open id is un-minimized and raised instead.
  openWindow: (id, title, appType, contentId) =>
    set((s) => {
      const top = s.top + 1;
      const exists = s.windows.some((w) => w.id === id);
      return {
        top,
        windows: exists
          ? s.windows.map((w) =>
              w.id === id
                ? { ...w, contentId: contentId ?? w.contentId, isOpen: true, isMinimized: false, zIndex: top }
                : w,
            )
          : [...s.windows, { id, title, appType, contentId, isOpen: true, isMinimized: false, zIndex: top }],
      };
    }),

  openFolder: (entry) =>
    set((s) => {
      const top = s.top + 1;
      const win = s.windows.find((w) => w.id === EXPLORER_ID);

      if (!win) {
        return {
          top,
          windows: [
            ...s.windows,
            {
              id: EXPLORER_ID,
              title: entry.label,
              appType: 'explorer' as const,
              isOpen: true,
              isMinimized: false,
              zIndex: top,
              nav: { stack: [entry], index: 0 },
            },
          ],
        };
      }

      const nav = win.nav ?? { stack: [], index: -1 };
      const alreadyHere = nav.stack[nav.index]?.id === entry.id;
      // Navigating from mid-history discards the forward entries, as a browser does.
      const stack = alreadyHere ? nav.stack : [...nav.stack.slice(0, nav.index + 1), entry];
      const index = alreadyHere ? nav.index : stack.length - 1;

      return {
        top,
        windows: s.windows.map((w) =>
          w.id === EXPLORER_ID
            ? { ...w, title: entry.label, isOpen: true, isMinimized: false, zIndex: top, nav: { stack, index } }
            : w,
        ),
      };
    }),

  goBack: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id || !w.nav || w.nav.index <= 0) return w;
        const index = w.nav.index - 1;
        return { ...w, title: w.nav.stack[index].label, nav: { ...w.nav, index } };
      }),
    })),

  goForward: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id || !w.nav || w.nav.index >= w.nav.stack.length - 1) return w;
        const index = w.nav.index + 1;
        return { ...w, title: w.nav.stack[index].label, nav: { ...w.nav, index } };
      }),
    })),

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, isOpen: false } : w)) })),

  minimizeWindow: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)) })),

  focusWindow: (id) =>
    set((s) => {
      const top = s.top + 1;
      return {
        top,
        windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: top } : w)),
      };
    }),
}));
