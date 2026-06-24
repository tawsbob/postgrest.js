import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { Hono } from 'hono';
import { Pool } from 'pg';
import {
  assertDockerPostgres,
  assertGeneratedArtifacts,
  resetBootstrapAndSeed,
  TEST_JWT_SECRET,
  type SeededUsers,
} from '../../__tests__/helpers/integration.js';
import {
  signInvalidTestJwt,
  signTestJwt,
  signTestJwtWithoutSub,
} from '../../__tests__/helpers/jwt.js';
import { createApp } from '../../../generated/app.js';
import type { AppEnv } from '../types.js';

interface RequestOptions {
  method?: string;
  token?: string;
  body?: Record<string, unknown>;
}

async function request(
  app: Hono<AppEnv>,
  path: string,
  { method = 'GET', token, body }: RequestOptions = {},
): Promise<Response> {
  return app.request(path, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('ACL integration (Docker + HTTP)', { concurrency: 1 }, () => {
  let pool: Pool;
  let app: Hono<AppEnv>;
  let users: SeededUsers;
  let aliceToken: string;
  let adminToken: string;

  before(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;

    assertGeneratedArtifacts();

    pool = await assertDockerPostgres();
    ({ users } = await resetBootstrapAndSeed(pool));
    app = createApp({ pool });

    aliceToken = signTestJwt({ sub: users.alice.id, role: 'USER' }, TEST_JWT_SECRET);
    adminToken = signTestJwt({ sub: users.admin.id, role: 'ADMIN' }, TEST_JWT_SECRET);
  });

  after(async () => {
    await pool.end();
  });

  describe('anonymous callers (PUBLIC role)', () => {
    it('denies GET /users', async () => {
      const response = await request(app, '/users');

      assert.equal(response.status, 403);
    });

    it('denies GET /users/:id', async () => {
      const response = await request(app, `/users/${users.alice.id}`);

      assert.equal(response.status, 403);
    });

    it('denies DELETE /users/:id', async () => {
      const response = await request(app, `/users/${users.alice.id}`, { method: 'DELETE' });

      assert.equal(response.status, 403);
    });
  });

  describe('USER role (row-scoped access)', () => {
    it('returns only own row on GET /users', async () => {
      const response = await request(app, '/users', { token: aliceToken });

      assert.equal(response.status, 200);
      const rows = (await response.json()) as Array<{ id: string }>;
      assert.equal(rows.length, 1);
      assert.equal(rows[0]!.id, users.alice.id);
    });

    it('returns own row on GET /users/:id', async () => {
      const response = await request(app, `/users/${users.alice.id}`, { token: aliceToken });

      assert.equal(response.status, 200);
      const row = (await response.json()) as { id: string };
      assert.equal(row.id, users.alice.id);
    });

    it('returns 404 when accessing another user row', async () => {
      const response = await request(app, `/users/${users.bob.id}`, { token: aliceToken });

      assert.equal(response.status, 404);
    });

    it('denies DELETE on own row (operation not allowed)', async () => {
      const response = await request(app, `/users/${users.alice.id}`, {
        method: 'DELETE',
        token: aliceToken,
      });

      assert.equal(response.status, 403);
    });

    it('allows POST /users (insert without row filter)', async () => {
      const response = await request(app, '/users', {
        method: 'POST',
        token: aliceToken,
        body: {
          email: 'new-user@b.com',
          name: 'New User',
          balance: 0,
        },
      });

      assert.equal(response.status, 201);
    });

    it('allows PUT on own row', async () => {
      const response = await request(app, `/users/${users.alice.id}`, {
        method: 'PUT',
        token: aliceToken,
        body: { name: 'Alice Updated' },
      });

      assert.equal(response.status, 200);
      const row = (await response.json()) as { name: string };
      assert.equal(row.name, 'Alice Updated');
    });

    it('returns 404 on PUT for another user row', async () => {
      const response = await request(app, `/users/${users.bob.id}`, {
        method: 'PUT',
        token: aliceToken,
        body: { name: 'Blocked Update' },
      });

      assert.equal(response.status, 404);
    });
  });

  describe('ADMIN role (full access)', () => {
    it('returns all users on GET /users', async () => {
      const response = await request(app, '/users', { token: adminToken });

      assert.equal(response.status, 200);
      const rows = (await response.json()) as Array<{ id: string }>;
      assert.ok(rows.length >= 4);
    });

    it('returns any user on GET /users/:id', async () => {
      const response = await request(app, `/users/${users.bob.id}`, { token: adminToken });

      assert.equal(response.status, 200);
      const row = (await response.json()) as { id: string };
      assert.equal(row.id, users.bob.id);
    });

    it('allows DELETE on any user row', async () => {
      const response = await request(app, `/users/${users.publicUser.id}`, {
        method: 'DELETE',
        token: adminToken,
      });

      assert.equal(response.status, 200);
    });
  });

  describe('JWT authentication errors', () => {
    it('returns 401 for invalid JWT signature', async () => {
      const invalidToken = signInvalidTestJwt(
        { sub: users.alice.id, role: 'USER' },
        TEST_JWT_SECRET,
      );
      const response = await request(app, '/users', { token: invalidToken });

      assert.equal(response.status, 401);
    });

    it('returns 401 when JWT is missing sub claim', async () => {
      const tokenWithoutSub = signTestJwtWithoutSub('USER', TEST_JWT_SECRET);
      const response = await request(app, '/users', { token: tokenWithoutSub });

      assert.equal(response.status, 401);
    });
  });

  describe('models without @policy (open endpoints)', () => {
    it('allows GET /logs without authentication', async () => {
      const response = await request(app, '/logs');

      assert.equal(response.status, 200);
    });
  });
});
