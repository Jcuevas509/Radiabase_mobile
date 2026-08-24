import { create } from 'zustand';

/**
 * The admin-tools menu presents as a native bottom sheet (iOS pageSheet)
 * instead of a side drawer. The hamburger opens it from anywhere; the sheet
 * itself is mounted once at the app layout root.
 */
type MenuSheetState = {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
};

export const useMenuSheetStore = create<MenuSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
