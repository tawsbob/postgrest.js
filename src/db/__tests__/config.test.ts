import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getDatabaseUrl } from '../config.js';
import { markEnvLoadedForTests, resetLoadEnvForTests } from '../load-env.js';

describe('getDatabaseUrl', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    resetLoadEnvForTests();
  });

  it('throws when DATABASE_URL is unset', () => {
    delete process.env.DATABASE_URL;
    resetLoadEnvForTests();
    markEnvLoadedForTests();

    assert.throws(() => getDatabaseUrl(), /DATABASE_URL is not set/);
  });

  it('returns DATABASE_URL when set', () => {
    const expectedUrl = 'postgresql://postgrest:postgrest@localhost:5432/postgrest';
    process.env.DATABASE_URL = expectedUrl;
    resetLoadEnvForTests();

    assert.equal(getDatabaseUrl(), expectedUrl);
  });
});
