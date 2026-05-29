//Admin functionality for deleting specific user
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser || currentUser.role !== 'admin') {return json({ success: false, message: 'Admin access required' }, { status: 403 });}

    const userId = Number(params.id);
    if (!userId) {return json({success: false, message: 'Invalid user ID'}, { status: 400 }); }

    if (userId === currentUser.id) { return json( {success: false, message: 'You cannot delete your own admin account while logged in.' },{ status: 400 } );}

    const [deckRows] = await db.execute(` SELECT id FROM decks WHERE user_id = ? `,
      [userId]);

    const userDecks = deckRows as Array<{ id: number }>;

    for (const userDeck of userDecks) {
      await db.execute(`DELETE FROM deck_cards WHERE deck_id = ? `,
        [userDeck.id]);
    }
    await db.execute( `DELETE FROM decks WHERE user_id = ? `,
      [userId]);
    await db.execute(` DELETE FROM users WHERE id = ? `,
      [userId]);

    return json({ success: true, message: 'User deleted successfully'});

  } catch (error) {
    console.error('Failed to delete user:', error);

    return json({success: false, message: 'Failed to delete user', error: error instanceof Error ? error.message : String(error)
      }, { status: 500 } );
  }
};