//handles logout and clear auth cookie
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearAuthCookie } from '$lib/server/jwt';

export const POST: RequestHandler = async ({ cookies }) => { clearAuthCookie(cookies); return json({success: true, message: 'Logged out successfully'});};