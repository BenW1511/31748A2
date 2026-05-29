// checks login credentials, verif the password hash, creating a JWT, and setting the auth cookie
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import bcrypt from 'bcryptjs';
import { dev } from '$app/environment';

import { db } from '$lib/server/sqlDB';
import { createJwt, setAuthCookie } from '$lib/server/jwt';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {return json({success: false, message: 'Missing email or password'},{ status: 400 });}

    const [rows] = await db.execute(`SELECT id, username, email, password_hash, role FROM users WHERE email = ? LIMIT 1 `,[email.trim().toLowerCase()]);

    const users = rows as Array<{
      id: number;
      username: string;
      email: string;
      password_hash: string;
      role: string;
    }>;

    if (users.length === 0) { return json({success: false,message: 'No account found with that email'},{ status: 401 });}
    const foundUser = users[0];

    const passwordMatches = await bcrypt.compare(password,foundUser.password_hash);
    if (!passwordMatches) {return json({success: false, message: 'Incorrect password' }, { status: 401 });}

    const user = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role
    };

    const daJWT = createJwt(user);
    setAuthCookie(cookies, daJWT, dev);
    return json({success: true, message: 'Login successful', user});

  } catch (error) {
    console.error('Login failed:', error);

    return json({success: false, message: 'Login failed',error: error instanceof Error ? error.message : String(error)},{ status: 500 });
  }
};