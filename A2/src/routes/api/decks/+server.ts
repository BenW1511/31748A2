//for creating new decks and loading decks owned by logged-in user.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser) { return json( {success: false, message: 'Not logged in' }, { status: 401 } ); }

    const [rows] = await db.execute(` SELECT id, user_id, name, commander_card_id, created_at AS createdAt, updated_at AS updatedAt FROM decks WHERE user_id = ? ORDER BY updated_at DESC `,
      [currentUser.id]);

    return json({ success: true, decks: rows });
  } catch (error) {
    console.error('Failed to load decks:', error);
    return json({success: false,message: 'Failed to load decks', error: error instanceof Error ? error.message : String(error) }, { status: 500 } );
  }
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);
    if (!currentUser) { return json( {success: false, message: 'Not logged in' }, { status: 401 } ); }

    const { name } = await request.json();
    if (!name) { return json({ success: false, message: 'Missing deck name' }, { status: 400 } ); }

    await db.execute(` INSERT INTO decks (user_id, name) VALUES (?, ?) `,
      [currentUser.id, name] );

    return json({success: true, message: 'Deck created successfully' });
  } catch (error) {
    console.error('Failed to create deck:', error);

    return json({success: false, message: 'Failed to create deck', error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
  }
};