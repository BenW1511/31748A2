// Manages current selected deck state and operations like adding/removing cards and loading said deck data from db
import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type NonCommanderSection =
  | 'Lands'
  | 'Creatures'
  | 'Instants'
  | 'Sorceries'
  | 'Artifacts'
  | 'Enchantments'
  | 'Planeswalkers'
  | 'Other';

export type DeckSection = 'Commander' | NonCommanderSection;

export type DeckCard = {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  image_url?: string;
  source?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  oracle_text?: string;
  quantity: number;
  section: DeckSection;
};

export type DeckState = {
  commander: DeckCard | null;
  Lands: DeckCard[];
  Creatures: DeckCard[];
  Instants: DeckCard[];
  Sorceries: DeckCard[];
  Artifacts: DeckCard[];
  Enchantments: DeckCard[];
  Planeswalkers: DeckCard[];
  Other: DeckCard[];
};

export const nonCommanderSections: NonCommanderSection[] = [
  'Lands',
  'Creatures',
  'Instants',
  'Sorceries',
  'Artifacts',
  'Enchantments',
  'Planeswalkers',
  'Other'
];

export const allSections: DeckSection[] = [
  'Commander',
  ...nonCommanderSections
];

function createEmptyDeck(): DeckState {
  return {
    commander: null,
    Lands: [],
    Creatures: [],
    Instants: [],
    Sorceries: [],
    Artifacts: [],
    Enchantments: [],
    Planeswalkers: [],
    Other: []
  };
}

function normaliseCard(card: Partial<DeckCard>, section: DeckSection): DeckCard {
  return {
    id: String(card.id ?? ''),
    name: String(card.name ?? 'Unknown Card'),
    mana_cost: card.mana_cost ?? '',
    type_line: card.type_line ?? '',
    image_url: card.image_url ?? '',
    source: card.source ?? 'scryfall',
    cmc: card.cmc,
    colors: card.colors ?? [],
    color_identity: card.color_identity ?? [],
    oracle_text: card.oracle_text ?? '',
    quantity: Number(card.quantity ?? 1),
    section
  };
}

function loadDeckFromLocalStorage(): DeckState {
  if (!browser) { return createEmptyDeck();}

  const saved = localStorage.getItem('deck');
  if (!saved) {return createEmptyDeck();}

  try {
    const parsed = JSON.parse(saved) as Partial<DeckState>;

    return {
      commander: parsed.commander ?? null,
      Lands: parsed.Lands ?? [],
      Creatures: parsed.Creatures ?? [],
      Instants: parsed.Instants ?? [],
      Sorceries: parsed.Sorceries ?? [],
      Artifacts: parsed.Artifacts ?? [],
      Enchantments: parsed.Enchantments ?? [],
      Planeswalkers: parsed.Planeswalkers ?? [],
      Other: parsed.Other ?? []
    };
  } catch {return createEmptyDeck();}
}

function saveDeckToLocalStorage(deck: DeckState) {
  if (!browser){return};
  localStorage.setItem('deck', JSON.stringify(deck));
}

function createDeckStore() {
  const { subscribe, set, update } = writable<DeckState>(loadDeckFromLocalStorage());

  function persist(deck: DeckState) {saveDeckToLocalStorage(deck); return deck;}

  return {
    subscribe,
    reset() {
      const emptyDeck = createEmptyDeck();
      saveDeckToLocalStorage(emptyDeck);
      set(emptyDeck);
    },

    set(deck: DeckState) {saveDeckToLocalStorage(deck); set(deck);},

    setCommander(card: Partial<DeckCard>) {
      update((deck) => { deck.commander = normaliseCard(card, 'Commander'); return persist(deck);});},

    clearCommander() {update((deck) => {deck.commander = null; return persist(deck);});},

    addCard(section: DeckSection, card: Partial<DeckCard>) {
      update((deck) => {
        if (section === 'Commander') {deck.commander = normaliseCard(card, 'Commander'); return persist(deck); }

        const normalisedCard = normaliseCard(card, section);
        const existingCard = deck[section].find((storedCard) => storedCard.id === normalisedCard.id);

        if (existingCard) {existingCard.quantity += 1;} else {deck[section].push(normalisedCard);}
        return persist(deck);
      });
    },

    removeCard(section: DeckSection, cardId: string) {
      update((deck) => {
        if (section === 'Commander') {
          if (deck.commander?.id === cardId) {
            deck.commander = null;
          }
          return persist(deck);
        }

        const existingCard = deck[section].find((card) => card.id === cardId);
        if (!existingCard) {return deck;}
        if (existingCard.quantity > 1) {existingCard.quantity -= 1;} else {deck[section] = deck[section].filter((card) => card.id !== cardId);}
        return persist(deck);
      });
    },

    clearSection(section: NonCommanderSection) {update((deck) => {deck[section] = [];return persist(deck);});},

    async loadFromDatabase(deckId: number) {
      try {
        const response = await fetch(`/api/decks/${deckId}/cards`);
        const data = await response.json();

        if (!data.success) {
          console.error('Could not load deck:', data.message);
          const emptyDeck = createEmptyDeck();
          saveDeckToLocalStorage(emptyDeck);
          set(emptyDeck);
          return;
        }
        const loadedDeck = createEmptyDeck();

        for (const row of data.cards) {
          const section = row.section as DeckSection;
          const card = normaliseCard(row, section);

          if (section === 'Commander') {loadedDeck.commander = card;} else if (nonCommanderSections.includes(section)) {loadedDeck[section].push(card);} else {
            loadedDeck.Other.push({
              ...card,
              section: 'Other'
            });
          }
        }
        saveDeckToLocalStorage(loadedDeck);
        set(loadedDeck);

      } catch (error) {
        console.error('Failed to load deck from database:', error);
        const emptyDeck = createEmptyDeck();
        saveDeckToLocalStorage(emptyDeck);
        set(emptyDeck);
      }
    }
  };
}
export const deckStore = createDeckStore();
export const deck = deckStore;