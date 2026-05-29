//adminto edit specific user’s details
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/sqlDB';
import { getUserFromCookies } from '$lib/server/jwt';

const allowedEmailDomains = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'UTS.edu.au',
  'student.uts.edu.au'
];

function isAllowedEmail(emailAddress: string) {
  const trimmedEmail = emailAddress.trim().toLowerCase();

  if (!trimmedEmail.includes('@')) {return false;}

  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {return false;}

  const domain = parts[1];
  return allowedEmailDomains.includes(domain);
}

export const PUT: RequestHandler = async ({ params, request, cookies }) => {
  try {
    const currentUser = getUserFromCookies(cookies);

    if (!currentUser || currentUser.role !== 'admin') {return json({success: false, message: 'Admin access required'}, { status: 403 });}

    const userId = Number(params.id);
    if (!userId) {return json({success: false, message: 'Invalid user ID'}, { status: 400 }); }

    const { username, email, newRole } = await request.json();

    if (!username || !email || !newRole) {return json({success: false, message: 'Missing user fields'}, { status: 400 });}

    if (newRole !== 'user' && newRole !== 'admin') {return json({ success: false, message: 'Role must be either user or admin' }, { status: 400 });}

    if (!isAllowedEmail(email)) {return json({success: false, message: 'Email must use Gmail, Hotmail, Outlook, Live, Yahoo or UTS domain.'}, { status: 400 }); }

    if (userId === currentUser.id && newRole !== 'admin') {return json({success: false, message: 'You cannot remove your own admin role while logged in.' }, { status: 400 }); }

    await db.execute(`UPDATE users SET username = ?, email = ?, role = ? WHERE id = ? `,
      [username.trim(), email.trim().toLowerCase(), newRole, userId]);

    return json({ success: true, message: 'User updated successfully'});
  } catch (error) {
    console.error('Failed to update user:', error);

    return json({success: false, message: 'Failed to update user', error: error instanceof Error ? error.message : String(error)}, { status: 500 } );
  }
};