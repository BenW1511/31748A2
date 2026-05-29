// for handling of JSON Web Tokens (jwt)(creation and validation thereof) and auth cookie management 
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

const COOKIE_NAME = 'auth_cookie';

export function createJwt(user: AuthUser) {
  return jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },env.JWT_SECRET, {expiresIn: '2h'});
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
  } catch {return null;}
}

export function getUserFromCookies(cookies: Cookies) {
  const tastyToken = cookies.get(COOKIE_NAME);
  if (!tastyToken) {return null;}
  return verifyJwt(tastyToken);
}

export function setAuthCookie(cookies: Cookies, token: string, isDev: boolean) {
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: !isDev,
    maxAge: 60 * 60 * 2
  });
}

export function clearAuthCookie(cookies: Cookies) {cookies.delete(COOKIE_NAME, {path: '/'});}