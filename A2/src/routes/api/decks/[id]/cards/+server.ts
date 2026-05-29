// loading cards from specific deck and adding cards to said deck.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

async function canAccessDeck(deckId: number, userId: number, role: string) {
  if (role === 'admin') { return true; }

  const [rows] = await db.execute(` SELECT id FROM decks WHERE id = ? AND user_id = ? LIMIT 1 `,
    [deckId, userId]);

  const decks = rows as Array<{ id: number }>;
  return (decks.length > 0);
}

export const GET: RequestHandler = async ({ params, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser) {return json({success: false, message: 'Not logged in' }, { status: 401 } ); }

    const deckId = Number(params.id);

    if (!deckId) { return json( { success: false, message: 'Invalid deck ID'}, { status: 400 });}

    const allowed = await canAccessDeck(deckId, currentUser.id, currentUser.role);

    if (!allowed) {return json( {success: false, message: 'You do not have access to this deck' }, { status: 403 });}

    const [rows] = await db.execute(` SELECT deck_cards.id AS deck_card_id, deck_cards.quantity, deck_cards.section, cards.id, cards.name, cards.mana_cost, cards.type_line, cards.image_url, cards.source FROM deck_cards JOIN cards ON deck_cards.card_id = cards.id WHERE deck_cards.deck_id = ? ORDER BY deck_cards.section, cards.name `,
      [deckId]);

    return json({ success: true, cards: rows});
  
  } catch (error) {
    console.error('Failed to load deck cards:', error);

    return json( { success: false, message: 'Failed to load deck cards', error: error instanceof Error ? error.message : String(error) }, { status: 500 } );
  }
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);
    if (!currentUser) { return json( { success: false, message: 'Not logged in' }, { status: 401 }); }
    const deckId = Number(params.id);
    if (!deckId) { return json({success: false, message: 'Invalid deck ID'},{ status: 400 });}

    const allowed = await canAccessDeck(deckId, currentUser.id, currentUser.role);
    if (!allowed) {return json( {success: false, message: 'You do not have access to this deck' }, { status: 403 });}


    const { card, section } = await request.json();
    if (!card || !card.id || !card.name || !section) {return json({success: false, message: 'Missing card or section'},{ status: 400 });}

    await db.execute( ` INSERT INTO cards ( id, name, mana_cost, type_line, image_url, source ) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), mana_cost = VALUES(mana_cost),type_line = VALUES(type_line), image_url = VALUES(image_url), source = VALUES(source), updatedAt = CURRENT_TIMESTAMP `,
      [card.id, card.name, card.mana_cost ?? '', card.type_line ?? '', card.image_url ?? '', card.source ?? 'scryfall' ]);

    const [existingRows] = await db.execute( ` SELECT id, quantity FROM deck_cards WHERE deck_id = ? AND card_id = ? AND section = ? LIMIT 1 `,
      [deckId, card.id, section]);

    const existingCards = existingRows as Array<{id: number; quantity: number; }>;

    if (existingCards.length > 0) {
      await db.execute(`UPDATE deck_cards SET quantity = quantity + 1 WHERE id = ?`, 
      [existingCards[0].id]);
    } else {
      await db.execute(`INSERT INTO deck_cards (deck_id, card_id, quantity,section ) VALUES (?, ?, 1, ?)`,
      [deckId, card.id, section]);
    }

    return json({success: true, message: 'Card saved to deck' });
  } catch (error) {
    console.error('Failed to save card to deck:', error);

    return json( {success: false, message: 'Failed to save card to deck', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
};