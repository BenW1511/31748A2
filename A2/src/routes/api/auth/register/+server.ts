//handles user reg, email validation, password hashing, and inserting into database
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/sqlDB';

const allowedEmailDomains = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'student.uts.edu.au',
  'uts.edu.au'
];

function isAllowedEmail(emailAddress: string) {
  const trimmedEmail = emailAddress.trim().toLowerCase();

  if (!trimmedEmail.includes('@')) {return false;}
  const domain = trimmedEmail.split('@')[1];
  return allowedEmailDomains.includes(domain);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) { return json({success: false, message: 'Missing required fields' }, { status: 400 } );}

    if (!isAllowedEmail(email)) {return json({ success: false, message: 'Email must use Gmail, Hotmail, Outlook, Live, Yahoo, or UTS domain.'},{ status: 400 });}
    const passwordHash = await bcrypt.hash(password, 10);

    await db.execute(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
      [username.trim(), email.trim().toLowerCase(), passwordHash ]);

    return json({success: true, message: 'User registered successfully' });

  } catch (error) {
    console.error('Registration failed:', error);

    return json({ success: false, message: 'Registration failed', error: error instanceof Error ? error.message : String(error) },{ status: 500 } );
  }
};