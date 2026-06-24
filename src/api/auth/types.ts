import type { Context } from 'hono';
import type { AppEnv } from '../types.js';

export const PUBLIC_ROLE = 'PUBLIC';

export interface AuthUser {
  id: string;
  [key: string]: unknown;
}

export interface AuthContext {
  role: string;
  user?: AuthUser;
}

export type AuthResolver = (c: Context<AppEnv>) => Promise<AuthContext | null>;
