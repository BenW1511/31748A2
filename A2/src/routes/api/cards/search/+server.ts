// search Scryfall for cards and cache returned card data 
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

type ScryfallCard = {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  image_uris?: {
    small?: string;
    normal?: string;
  };
  card_faces?: {
    mana_cost?: string;
    oracle_text?: string;
    image_uris?: {
      small?: string;
      normal?: string;
    };
  }[];
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  oracle_text?: string;
};

function getCardImage(card: ScryfallCard) {
  return (card.image_uris?.small ?? card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.normal ?? '' );
}

function normaliseCard(card: ScryfallCard) {
  return {
    id: card.id,
    name: card.name,
    mana_cost: card.mana_cost ?? card.card_faces?.[0]?.mana_cost ?? '',
    type_line: card.type_line ?? '',
    image_url: getCardImage(card),
    source: 'scryfall',
    cmc: card.cmc ?? 0,
    colors: card.colors ?? [],
    color_identity: card.color_identity ?? [],
    oracle_text: card.oracle_text ?? card.card_faces?.[0]?.oracle_text ?? ''
  };
}

export const GET: RequestHandler = async ({ url, fetch, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);
    if (!currentUser) {return json( { success: false, message: 'Not logged in' }, { status: 401 } ); }

    const query = url.searchParams.get('q');
    if (!query) {return json({success: false,message: 'Missing search query' },{ status: 400 } );}

    const scryfallResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards`);
    const scryfallData = await scryfallResponse.json();

    if (!scryfallResponse.ok || scryfallData.object === 'error') {
      return json({success: false, message: scryfallData.details ?? 'No cards found' }, { status: 404 } );
    }

    const cards = scryfallData.data.map((card: ScryfallCard) => {return normaliseCard(card);});

    for (const card of cards) {
      await db.execute(` INSERT INTO cards ( id, name, mana_cost, type_line, image_url, source ) VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name), mana_cost = VALUES(mana_cost), type_line = VALUES(type_line), image_url = VALUES(image_url), source = VALUES(source), updatedAt = CURRENT_TIMESTAMP `, 
        [card.id, card.name, card.mana_cost, card.type_line, card.image_url, card.source ]);
    }

    return json({success: true, cards});
  } catch (error) {
    console.error('Failed to search/cache Scryfall cards:', error);

    return json({success: false, message: 'Failed to search cards', error: error instanceof Error ? error.message : String(error)
      }, { status: 500 } );
  }
};