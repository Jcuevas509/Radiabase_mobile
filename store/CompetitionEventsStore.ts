import { create } from 'zustand';
import type { CompetitionEvent } from 'types/manager.types';

/**
 * Locally launched competition events, layered over the fetched list so
 * the list and detail screens both see them. Seam: replaced by POST
 * /events once the competitions backend is rebuilt.
 */
type CompetitionEventsState = {
  readonly localEvents: readonly CompetitionEvent[];
  readonly addEvent: (event: CompetitionEvent) => void;
};

export const useCompetitionEventsStore = create<CompetitionEventsState>((set) => ({
  localEvents: [],
  addEvent: (event) => set((state) => ({ localEvents: [event, ...state.localEvents] })),
}));
