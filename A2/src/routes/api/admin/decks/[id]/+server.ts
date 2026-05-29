//admin deleting specific deck.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser || currentUser.role !== 'admin') {return json({success: false, message: 'Admin access required'}, { status: 403 });}

    const deckId = Number(params.id);
    if (!deckId) {return json({success: false, message: 'Invalid deck ID'}, { status: 400 });}

    await db.execute(`DELETE FROM deck_cards WHERE deck_id = ? `,
      [deckId]);
    await db.execute(`DELETE FROM decks WHERE id = ?`,
      [deckId]);

    return json({success: true, message: 'Deck deleted successfully'});
  } catch (error) {
    console.error('Failed to delete deck:', error);

    return json({success: false, message: 'Failed to delete deck', error: error instanceof Error ? error.message : String(error)
      }, { status: 500 } );
  }
};