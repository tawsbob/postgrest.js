// Run: npm test

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseModelBody } from '../../schema-dsl/__tests__/helpers.js';
import { normalizePolicies } from '../utils/policy.js';

describe('normalizePolicies', () => {
  it('normalizes role, allow list, and where clause', () => {
    const model = parseModelBody(`
      id: UUID @id
      @policy(role: USER, allow: [select, insert, update], where: "id = {{auth.user.id}}")
      @policy(role: ADMIN, allow: all)
    `);

    assert.deepEqual(normalizePolicies(model), [
      {
        role: 'USER',
        operations: ['select', 'insert', 'update'],
        where: 'id = {{auth.user.id}}',
      },
      {
        role: 'ADMIN',
        operations: 'all',
      },
    ]);
  });
});
