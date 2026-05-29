// user's currently selected deck
import { writable } from 'svelte/store';
export type DeckSummary = {
  id: number;
  user_id: number;
  name: string;
  commander_card_id: string | null;
  createdAt: string;
  updatedAt: string;
};
export const selectedDeck = writable<DeckSummary | null>(null);