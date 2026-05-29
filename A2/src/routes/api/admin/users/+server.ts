//Allows admin to retrieve all user/deck info for the admin panel
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);
    if (!currentUser || currentUser.role !== 'admin') {return json({success: false, message: 'Admin access required' }, { status: 403 } ); }

    const [users] = await db.execute( `SELECT id, username, email, role, created_at FROM users ORDER BY id ASC`);
    const [decks] = await db.execute(` SELECT id, user_id, name, commander_card_id, created_at AS createdAt, updated_at AS updatedAt FROM decks ORDER BY user_id ASC, updated_at DESC ` );

    return json({success: true, users, decks});
  } catch (error) {
    console.error('Failed to load admin data:', error);

    return json( {success: false, message: 'Failed to load admin data', error: error instanceof Error ? error.message : String(error) }, { status: 500 } );
  }
};