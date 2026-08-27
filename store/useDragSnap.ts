import { create } from 'zustand';

/**
 * The region a dragged window would take if it were dropped right now — `null`
 * until the pointer has *dwelled* in an edge zone long enough to mean it.
 *
 * Its own store, like useHint, for the same reason: this is transient pointer
 * feedback that changes mid-drag, and window state should not churn at that rate.
 * It is shared rather than local because the window detects the zone while the
 * desktop draws the outline — two components, one fact.
 *
 * Showing the outline is also what *arms* the snap: releasing without one does
 * nothing. What you can see is the only thing that can happen.
 */
export type SnapZone = 'left' | 'right' | 'top';

interface DragSnapState {
  zone: SnapZone | null;
  setZone: (zone: SnapZone | null) => void;
}

export const useDragSnap = create<DragSnapState>((set) => ({
  zone: null,
  setZone: (zone) => set({ zone }),
}));
