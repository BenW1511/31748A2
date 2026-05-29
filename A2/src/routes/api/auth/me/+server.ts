//checks JWT cookie and returns currently authd user.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromCookies } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ cookies }) => {
  const user = getUserFromCookies(cookies);
  if (!user) { return json({success: false, user: null, message: 'Not logged in'},{ status: 401 });}
  return json({success: true,user});
};