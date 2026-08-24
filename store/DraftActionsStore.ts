import { create } from 'zustand';

export type DraftActions = {
  readonly onCancel: () => void;
  readonly onRedraw: () => void;
  readonly onSave: () => void;
  readonly isSaving: boolean;
};

/**
 * While a drawn area is under review, the map screen publishes its three
 * actions here and the native tab bar morphs its items into them
 * (Cancel / Redraw / Save area). Null means the normal tabs are shown.
 */
type DraftActionsState = {
  readonly actions: DraftActions | null;
  /** True through the whole draw flow (painting AND reviewing). The bar
   * drops to three slots when drawing starts — a moment with no animation
   * to disturb — so the later morph into Cancel/Save/Redraw is a pure
   * relabel of existing slots with zero mounting work. */
  readonly isCompactBar: boolean;
  readonly setActions: (actions: DraftActions | null) => void;
  readonly setCompactBar: (isCompactBar: boolean) => void;
  /** Atomic morph update: one store change → one tab-bar transaction, so
   * the native collapse animates as a single transition with no trailing
   * layout nudge. */
  readonly setFlow: (actions: DraftActions | null, isCompactBar: boolean) => void;
};

export const useDraftActionsStore = create<DraftActionsState>((set) => ({
  actions: null,
  isCompactBar: false,
  setActions: (actions) => set({ actions }),
  setCompactBar: (isCompactBar) => set({ isCompactBar }),
  setFlow: (actions, isCompactBar) => set({ actions, isCompactBar }),
}));
