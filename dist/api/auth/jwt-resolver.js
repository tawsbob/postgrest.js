import { createHmac, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from './errors.js';
const BEARER_PREFIX = 'Bearer ';
const DEFAULT_ROLE_CLAIM = 'role';
const DEFAULT_USER_ID_CLAIM = 'sub';
const JWT_ALGORITHM = 'HS256';
export function createJwtResolver(options = {}) {
    const roleClaim = options.roleClaim ?? process.env.JWT_ROLE_CLAIM ?? DEFAULT_ROLE_CLAIM;
    const userIdClaim = options.userIdClaim ?? process.env.JWT_USER_ID_CLAIM ?? DEFAULT_USER_ID_CLAIM;
    return async (c) => {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith(BEARER_PREFIX)) {
            return null;
        }
        const token = authHeader.slice(BEARER_PREFIX.length).trim();
        if (!token) {
            return null;
        }
        const secret = options.secret ?? process.env.JWT_SECRET;
        if (!secret) {
            throw new UnauthorizedError('JWT_SECRET is not configured');
        }
        const payload = verifyJwt(token, secret);
        const role = String(payload[roleClaim] ?? 'PUBLIC');
        const userId = payload[userIdClaim];
        if (userId === undefined || userId === null || userId === '') {
            throw new UnauthorizedError(`JWT missing "${userIdClaim}" claim`);
        }
        const user = {
            id: String(userId),
            ...payload,
        };
        return { role, user };
    };
}
function verifyJwt(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new UnauthorizedError('Invalid JWT format');
    }
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', secret).update(signingInput).digest();
    const actualSignature = base64UrlDecode(encodedSignature);
    if (expectedSignature.length !== actualSignature.length ||
        !timingSafeEqual(expectedSignature, actualSignature)) {
        throw new UnauthorizedError('Invalid JWT signature');
    }
    const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8'));
    if (header.alg !== JWT_ALGORITHM) {
        throw new UnauthorizedError(`Unsupported JWT algorithm "${header.alg ?? 'unknown'}"`);
    }
    return JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
}
function base64UrlDecode(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + padding, 'base64');
}
