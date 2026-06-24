import { createHmac } from 'node:crypto';

export interface TestJwtPayload {
  sub: string;
  role: string;
  [key: string]: unknown;
}

function base64UrlEncode(value: string | Buffer): string {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
  return buffer.toString('base64url');
}

export function signTestJwt(payload: TestJwtPayload, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}

export function signInvalidTestJwt(payload: TestJwtPayload, secret: string): string {
  return `${signTestJwt(payload, secret)}invalid`;
}

export function signTestJwtWithoutSub(role: string, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ role }));
  const signingInput = `${header}.${body}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}
