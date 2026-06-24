import { ForbiddenError } from './errors.js';
import type { AuthContext } from './types.js';

const TEMPLATE_PATTERN = /\{\{([^}]+)\}\}/g;

export function interpolateTemplate(template: string, auth: AuthContext): string {
  const root = { auth };

  return template.replace(TEMPLATE_PATTERN, (_, rawPath: string) => {
    const path = rawPath.trim();
    const value = resolveAuthPath(root, path);

    if (value === undefined || value === null) {
      throw new ForbiddenError(`Missing auth context value for "${path}"`);
    }

    return String(value);
  });
}

function resolveAuthPath(auth: AuthContext, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = auth;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}
