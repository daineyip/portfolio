import { create } from 'zustand';

/**
 * "Where is that?" — hovering an <Open> link in a document points at the thing it
 * names: the desktop icon pulses, or the menu the item lives under does.
 *
 * Kept out of useWindowStore on purpose. This is transient pointer feedback, not
 * window state, and it changes on every mouseover; window state should not churn
 * at that rate.
 */
interface HintState {
  hintId: string | null;
  setHint: (id: string | null) => void;
}

export const useHint = create<HintState>((set) => ({
  hintId: null,
  setHint: (id) => set({ hintId: id }),
}));
