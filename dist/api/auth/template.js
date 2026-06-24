import { ForbiddenError } from './errors.js';
const TEMPLATE_PATTERN = /\{\{([^}]+)\}\}/g;
export function interpolateTemplate(template, auth) {
    const root = { auth };
    return template.replace(TEMPLATE_PATTERN, (_, rawPath) => {
        const path = rawPath.trim();
        const value = resolveAuthPath(root, path);
        if (value === undefined || value === null) {
            throw new ForbiddenError(`Missing auth context value for "${path}"`);
        }
        return String(value);
    });
}
function resolveAuthPath(root, path) {
    const segments = path.split('.').filter(Boolean);
    let current = root;
    for (const segment of segments) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
