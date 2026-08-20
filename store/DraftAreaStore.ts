import { create } from 'zustand';
import type { CoordinateProps } from 'types/componentsTypes';

type DraftAreaState = {
  readonly coordinates: CoordinateProps[] | null;
  readonly setCoordinates: (coordinates: CoordinateProps[] | null) => void;
  readonly moveVertex: (index: number, coordinate: CoordinateProps) => void;
};

/**
 * Live coordinates of the painted-but-unsaved turf boundary. Kept out of the
 * map screen's state on purpose: vertex drags update per finger movement,
 * and holding them in FieldMapScreen re-rendered the whole map tree per
 * frame (probe: 30+ renders per 2s mid-drag). Only DraftAreaPolygon and
 * DraftVertexHandles subscribe.
 */
export const useDraftAreaStore = create<DraftAreaState>((set) => ({
  coordinates: null,
  setCoordinates: (coordinates) => set({ coordinates }),
  moveVertex: (index, coordinate) => set((state) => {
    if (!state.coordinates || index < 0 || index >= state.coordinates.length) {
      return state;
    }
    const next = [...state.coordinates];
    next[index] = coordinate;
    return { coordinates: next };
  }),
}));
