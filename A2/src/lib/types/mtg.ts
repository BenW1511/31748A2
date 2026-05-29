// defines TypeScript types used elsewhere
export type DeckSection = 
| 'Commander' 
| 'Creatures' 
| 'Artifacts' 
| 'Enchantments' 
| 'Instants' 
| 'Sorceries' 
| 'Planeswalkers' 
| 'Lands';

export type NonCommanderSection = Exclude<DeckSection, 'Commander'>;

export type DeckCard = { 
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  image_url?: string | null;
  quantity: number;
  section: DeckSection;
};
export type DeckState = {
  commander: DeckCard | null;
  sections: Record<NonCommanderSection, DeckCard[]>;
};