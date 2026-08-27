import { create } from 'zustand';

/**
 * Whether the ⌘K palette is open.
 *
 * Its own store, like useHint, and deliberately not part of useWindowStore: the
 * palette is not a window — it has no z-index, never appears in the taskbar, and
 * closes rather than minimizes. Keeping it out means the menu bar's search field
 * can open it without prop-drilling, and window state doesn't churn every time
 * someone hits Escape.
 */
interface SearchState {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export const useSearch = create<SearchState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
}));
