import { create } from 'zustand';

export type AppType = 'explorer' | 'reader' | 'pdf' | 'video' | 'image' | 'bio' | 'inbox';

/** A folder an Explorer window can be pointed at. */
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
  isMaximized: boolean;
  zIndex: number;
  /** Explorer windows only: which folder is currently shown. */
  folderId?: string;
}

interface WindowState {
  windows: AppWindow[];
  top: number;
  openWindow: (
    id: string,
    title: string,
    appType: AppType,
    contentId?: string,
    opts?: { maximized?: boolean },
  ) => void;
  openFolder: (entry: NavEntry) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
}

/**
 * Folders navigate in place inside this one window; documents each get their own.
 * Reader windows are keyed `reader:<docId>`, so openWindow's dedupe-by-id already
 * gives exactly one window per document.
 *
 * Navigation is hierarchical, not historical: the window holds only the folder it
 * is showing, and "up" is derived from the tree. A back/forward history would let
 * the arrows walk sideways between unrelated desktop roots, which is not what
 * folder chrome should mean.
 */
export const EXPLORER_ID = 'explorer';

export const useWindowStore = create<WindowState>((set) => ({
  windows: [],
  top: 0,

  // Never duplicates: an already-open id is un-minimized and raised instead.
  openWindow: (id, title, appType, contentId, opts) =>
    set((s) => {
      const top = s.top + 1;
      const exists = s.windows.some((w) => w.id === id);
      return {
        top,
        windows: exists
          ? s.windows.map((w) =>
              w.id === id
                ? {
                    ...w,
                    contentId: contentId ?? w.contentId,
                    isOpen: true,
                    isMinimized: false,
                    isMaximized: opts?.maximized ?? w.isMaximized,
                    zIndex: top,
                  }
                : w,
            )
          : [
              ...s.windows,
              {
                id,
                title,
                appType,
                contentId,
                isOpen: true,
                isMinimized: false,
                isMaximized: opts?.maximized ?? false,
                zIndex: top,
              },
            ],
      };
    }),

  openFolder: (entry) =>
    set((s) => {
      const top = s.top + 1;
      const exists = s.windows.some((w) => w.id === EXPLORER_ID);

      return {
        top,
        windows: exists
          ? s.windows.map((w) =>
              w.id === EXPLORER_ID
                ? { ...w, title: entry.label, folderId: entry.id, isOpen: true, isMinimized: false, zIndex: top }
                : w,
            )
          : [
              ...s.windows,
              {
                id: EXPLORER_ID,
                title: entry.label,
                appType: 'explorer' as const,
                folderId: entry.id,
                isOpen: true,
                isMinimized: false,
                isMaximized: false,
                zIndex: top,
              },
            ],
      };
    }),

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, isOpen: false } : w)) })),

  minimizeWindow: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)) })),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)),
    })),

  focusWindow: (id) =>
    set((s) => {
      const top = s.top + 1;
      return {
        top,
        windows: s.windows.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: top } : w)),
      };
    }),
}));
