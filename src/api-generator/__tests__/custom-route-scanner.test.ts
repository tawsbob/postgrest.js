// Run: npm test

import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { discoverCustomRoutes } from '../custom-route-scanner.js';

const fixtureRoutesDir = path.resolve('src/api-generator/__tests__/fixtures/custom-routes');

describe('discoverCustomRoutes', () => {
  it('returns an empty list when the directory is missing', () => {
    const entries = discoverCustomRoutes(path.resolve('src/api-generator/__tests__/fixtures/missing-routes'));

    assert.deepEqual(entries, []);
  });

  it('discovers flat custom route files', () => {
    const entries = discoverCustomRoutes(fixtureRoutesDir);
    const health = entries.find((entry) => entry.basePath === 'health');

    assert.ok(health);
    assert.equal(health.importName, 'healthRouter');
    assert.equal(health.importPath, '../src/routes/health.js');
  });

  it('discovers nested custom route files', () => {
    const entries = discoverCustomRoutes(fixtureRoutesDir);
    const stripe = entries.find((entry) => entry.basePath === 'webhooks/stripe');

    assert.ok(stripe);
    assert.equal(stripe.importName, 'webhooksStripeRouter');
    assert.equal(stripe.importPath, '../src/routes/webhooks/stripe.js');
  });

  it('returns entries sorted by basePath', () => {
    const entries = discoverCustomRoutes(fixtureRoutesDir);

    assert.deepEqual(
      entries.map((entry) => entry.basePath),
      ['health', 'webhooks/stripe'],
    );
  });
});
