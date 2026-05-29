//for removing specific card from  specific deck
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

async function canAccessDeck(deckId: number, userId: number, role: string) {
  if (role === 'admin') { return true;}

  const [rows] = await db.execute(` SELECT id FROM decks WHERE id = ? AND user_id = ? LIMIT 1`,
    [deckId, userId]);

  const decks = rows as Array<{ id: number }>;
  return (decks.length > 0);
}

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser) { return json( {success: false, message: 'Not logged in'}, { status: 401 } );}

    const deckId = Number(params.id);
    const cardId = params.cardId;

    if (!deckId || !cardId) { return json({ success: false, message: 'Invalid deck ID or card ID' }, { status: 400 }); }

    const allowed = await canAccessDeck(deckId, currentUser.id, currentUser.role );

    if (!allowed) { return json({success: false, message: 'You do not have access to this deck' }, { status: 403 } ); }

    const [rows] = await db.execute(` SELECT id, quantity FROM deck_cards WHERE deck_id = ? AND card_id = ? LIMIT 1`,
      [deckId, cardId]);

    const deckCards = rows as Array<{id: number; quantity: number;}>;

    if (deckCards.length === 0) { return json({ success: false, message: 'Card not found in this deck' }, { status: 404 } );}

    const deckCard = deckCards[0];
    if (deckCard.quantity > 1) {
      await db.execute(` UPDATE deck_cards SET quantity = quantity - 1 WHERE id = ? `,
        [deckCard.id]);
    } else {
      await db.execute(` DELETE FROM deck_cards WHERE id = ? `,
        [deckCard.id]);
    }

    return json({ success: true, message: 'Card removed from deck' });

  } catch (error) {
    console.error('Failed to remove card from deck:', error);

    return json( {success: false, message: 'Failed to remove card from deck', error: error instanceof Error ? error.message : String(error)}, { status: 500 }
    );
  }
};