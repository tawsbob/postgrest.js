import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parse } from '../../schema-dsl/index.js';
import { SqlGenerator } from '../sql-generator.js';

const appSchemaPath = join(process.cwd(), 'app.schema');
const fixturePath = join(process.cwd(), 'src/sql-generator/__tests__/fixtures/app.schema.sql');

describe('SqlGenerator — app.schema', () => {
  const source = readFileSync(appSchemaPath, 'utf8');
  const schema = parse(source);
  const sql = new SqlGenerator().generate(schema);
  const expected = readFileSync(fixturePath, 'utf8');

  it('matches the golden SQL fixture', () => {
    assert.equal(sql, expected);
  });

  it('includes all generation sections', () => {
    for (const header of [
      '-- Extensions',
      '-- Enums',
      '-- Drop tables',
      '-- Create tables',
      '-- Alter tables (foreign keys)',
      '-- Create indexes',
      '-- Create triggers',
    ]) {
      assert.ok(sql.includes(header), `missing section ${header}`);
    }
  });

  it('generates extensions, enums, tables, foreign keys, indexes, and triggers', () => {
    assert.match(sql, /CREATE EXTENSION IF NOT EXISTS "pgcrypto"/);
    assert.match(sql, /CREATE TYPE user_role AS ENUM/);
    assert.match(sql, /CREATE TABLE "user"/);
    assert.match(sql, /CREATE TABLE profile/);
    assert.match(sql, /CREATE TABLE "order"/);
    assert.match(sql, /CREATE TABLE log/);
    assert.match(sql, /CREATE TABLE product/);
    assert.match(sql, /CREATE TABLE product_order/);
    assert.match(sql, /ALTER TABLE profile ADD CONSTRAINT profile_user_id_fkey/);
    assert.match(sql, /ALTER TABLE "order" ADD CONSTRAINT order_user_id_fkey/);
    assert.match(sql, /CREATE INDEX user_role_is_active_idx/);
    assert.match(sql, /CREATE UNIQUE INDEX user_email_idx/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION user_before_update_trigger_func/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION product_after_update_trigger_func/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION product_before_update_trigger_func/);
  });

  it('comments out validation attributes', () => {
    assert.match(sql, /-- @regex: pattern =/);
    assert.match(sql, /-- @range: min = 1, max = 120/);
  });

  it('transforms index WHERE clauses to snake_case field names', () => {
    assert.match(sql, /WHERE is_active = true/);
    assert.match(sql, /WHERE role = 'PUBLIC'/);
  });
});
