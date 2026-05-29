//tracks ui panels (right panel swapping between deckview and analytics)
import { writable } from 'svelte/store';
export type rightPanel = 'deck' | 'analytics';
export const rightPanelView = writable<rightPanel>('deck');