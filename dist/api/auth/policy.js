import { POLICIES } from 'generated/policies.js';
import { ForbiddenError } from './errors.js';
import { interpolateTemplate } from './template.js';
import { PUBLIC_ROLE } from './types.js';
const SIMPLE_WHERE_PATTERN = /^(\w+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/;
export { ForbiddenError, UnauthorizedError } from './errors.js';
export function assertPolicy(model, role, operation) {
    const policies = POLICIES[model];
    if (!policies || policies.length === 0) {
        throw new ForbiddenError(`No policies configured for model "${model}"`);
    }
    const policy = findPolicyForRole(policies, role);
    if (!policy) {
        throw new ForbiddenError(`Role "${role}" is not allowed to ${operation} ${model}`);
    }
    if (!isOperationAllowed(policy, operation)) {
        throw new ForbiddenError(`Role "${role}" is not allowed to ${operation} ${model}`);
    }
    return policy;
}
export function resolvePolicyWhere(policy, auth) {
    if (!policy.where) {
        return undefined;
    }
    const interpolated = interpolateTemplate(policy.where, auth);
    return parseSimpleWhereClause(interpolated);
}
export function mergeWhere(primary, policyWhere) {
    if (!policyWhere || Object.keys(policyWhere).length === 0) {
        return primary;
    }
    if (!primary || Object.keys(primary).length === 0) {
        return policyWhere;
    }
    return { AND: [primary, policyWhere] };
}
function findPolicyForRole(policies, role) {
    const directMatch = policies.find((policy) => policy.role === role);
    if (directMatch) {
        return directMatch;
    }
    if (role !== PUBLIC_ROLE) {
        return policies.find((policy) => policy.role === PUBLIC_ROLE);
    }
    return undefined;
}
function isOperationAllowed(policy, operation) {
    if (policy.operations === 'all') {
        return true;
    }
    return policy.operations.includes(operation);
}
function parseSimpleWhereClause(clause) {
    const trimmedClause = clause.trim();
    const match = trimmedClause.match(SIMPLE_WHERE_PATTERN);
    if (!match) {
        throw new ForbiddenError(`Unsupported policy where clause "${clause}". Only simple "field op value" forms are supported.`);
    }
    const [, field, operator, rawValue] = match;
    const value = parseWhereValue(rawValue.trim());
    if (operator === '=') {
        return { [field]: value };
    }
    if (operator === '!=' || operator === '<>') {
        return { NOT: { [field]: value } };
    }
    const operatorMap = {
        '>': 'gt',
        '>=': 'gte',
        '<': 'lt',
        '<=': 'lte',
    };
    const mappedOperator = operatorMap[operator];
    if (!mappedOperator) {
        throw new ForbiddenError(`Unsupported policy where operator "${operator}"`);
    }
    return { [field]: { [mappedOperator]: value } };
}
function parseWhereValue(rawValue) {
    if ((rawValue.startsWith("'") && rawValue.endsWith("'")) ||
        (rawValue.startsWith('"') && rawValue.endsWith('"'))) {
        return rawValue.slice(1, -1);
    }
    if (rawValue === 'true') {
        return true;
    }
    if (rawValue === 'false') {
        return false;
    }
    const numericValue = Number(rawValue);
    if (!Number.isNaN(numericValue) && rawValue !== '') {
        return numericValue;
    }
    return rawValue;
}
