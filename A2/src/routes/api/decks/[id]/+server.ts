//Handles specific deck actions (e.g. deleting selected deck )
import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const user = getUserFromCookies(cookies);

  if (!user) {return json({ success: false, message: 'Not logged in' },{ status: 401 } );}

  const deckId = Number(params.id);
  if (!deckId) {return json({ success: false, message: 'Invalid deck ID' },{ status: 400 });}

  try {
    const [deckRows] = await db.query('SELECT id, user_id FROM decks WHERE id = ?', [deckId] );

    const decks = deckRows as Array<{ id: number; user_id: number }>;
    if (decks.length === 0) { return json( { success: false, message: 'Deck not found' }, { status: 404 }); }

    const selectedDeck = decks[0];
    if (selectedDeck.user_id !== user.id && user.role !== 'admin') {
      return json({ success: false, message: 'You do not have permission to delete this deck' }, { status: 403 } );}

    await db.query('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);
    await db.query('DELETE FROM decks WHERE id = ?', [deckId]);
    return json({success: true, message: 'Deck deleted successfully' });
  } catch (error) {

    console.error('Delete deck failed:', error);
    return json({ success: false, message: 'Failed to delete deck' }, { status: 500 });
  }
};