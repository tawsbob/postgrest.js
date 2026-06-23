import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertKeyValueArgs,
  getAttr,
  getField,
  getKvPair,
  parseModelBody,
  parseSnippet,
} from './helpers.js';

function getDefaultArgs(modelBody: string) {
  const model = parseModelBody(modelBody);
  const field = model.fields[0];
  return getAttr(field, 'default').args;
}

function getTestAttrArgs(modelBody: string, attrName: string) {
  const model = parseModelBody(modelBody);
  const field = model.fields[0];
  return getAttr(field, attrName).args;
}

describe('Parser — value forms', () => {
  it('parses StringLiteral', () => {
    const args = getTestAttrArgs('x: INT @regex(pattern: "hello")', 'regex');
    const kv = assertKeyValueArgs(args);
    assert.equal(getKvPair(kv, 'pattern').value.kind, 'StringLiteral');
    assert.equal((getKvPair(kv, 'pattern').value as { value: string }).value, 'hello');
  });

  it('parses TripleStringLiteral', () => {
    const model = parseModelBody(`@@trigger { execute: """SQL""" }`);
    const kv = assertKeyValueArgs(model.directives[0].args);
    assert.equal(getKvPair(kv, 'execute').value.kind, 'TripleStringLiteral');
  });

  it('parses NumberLiteral integer', () => {
    const args = getTestAttrArgs('x: INT @range(min: 120)', 'range');
    const kv = assertKeyValueArgs(args);
    assert.equal((getKvPair(kv, 'min').value as { value: number }).value, 120);
  });

  it('parses NumberLiteral decimal', () => {
    const model = parseModelBody('total: DECIMAL(10.2)');
    assert.equal(model.fields[0].type.args![0].kind, 'NumberLiteral');
    assert.equal((model.fields[0].type.args![0] as { value: number }).value, 10.2);
  });

  it('parses BooleanLiteral', () => {
    const args = getDefaultArgs('active: BOOLEAN @default(true)');
    assert.equal((args as { expressions: { kind: string; value: boolean }[] }).expressions[0].kind, 'BooleanLiteral');
  });

  it('parses Identifier USER', () => {
    const args = getDefaultArgs('role: UserRole @default(USER)');
    assert.equal((args as { expressions: { kind: string; name: string }[] }).expressions[0].name, 'USER');
  });

  it('parses Identifier all', () => {
    const model = parseModelBody('@policy(role: ADMIN, allow: all)');
    const kv = assertKeyValueArgs(getModelAttrFromModel(model, 'policy').args);
    assert.equal(getKvPair(kv, 'allow').value.kind, 'Identifier');
    assert.equal((getKvPair(kv, 'allow').value as { name: string }).name, 'all');
  });

  it('parses Identifier CASCADE', () => {
    const model = parseModelBody(
      'user: User @relation(name: "X", onDelete: CASCADE)',
    );
    const kv = assertKeyValueArgs(getAttr(getField(model, 'user'), 'relation').args);
    assert.equal((getKvPair(kv, 'onDelete').value as { name: string }).name, 'CASCADE');
  });

  it('parses ArrayLiteral of Identifiers', () => {
    const model = parseModelBody('@policy(role: USER, allow: [select, insert, update])');
    const kv = assertKeyValueArgs(getModelAttrFromModel(model, 'policy').args);
    const arr = getKvPair(kv, 'allow').value;
    assert.equal(arr.kind, 'ArrayLiteral');
    assert.equal((arr as { elements: { name: string }[] }).elements.length, 3);
    assert.equal((arr as { elements: { name: string }[] }).elements[0].name, 'select');
  });

  it('parses empty ArrayLiteral', () => {
    const model = parseModelBody('@@index(fields: [])');
    const kv = assertKeyValueArgs(model.directives[0].args);
    const arr = getKvPair(kv, 'fields').value;
    assert.equal(arr.kind, 'ArrayLiteral');
    assert.deepEqual((arr as { elements: unknown[] }).elements, []);
  });

  it('parses BlockLiteral in extension options', () => {
    const schema = parseSnippet(
      'extensions { pgcrypto { version: "1.3" } }\nenums {}\nmodels {}',
    );
    assert.equal(schema.extensions[0].options!.kind, 'BlockLiteral');
  });

  it('parses CallExpression with no args', () => {
    const args = getDefaultArgs('id: UUID @default(gen_random_uuid())');
    assert.equal(args!.kind, 'ExpressionArgs');
    const call = (args as { expressions: { kind: string; callee: string; args: unknown[] }[] })
      .expressions[0];
    assert.equal(call.kind, 'CallExpression');
    assert.equal(call.callee, 'gen_random_uuid');
    assert.deepEqual(call.args, []);
  });

  it('parses CallExpression with args', () => {
    const args = getDefaultArgs('createdAt: TIMESTAMP @default(now())');
    const call = (args as { expressions: { kind: string; callee: string; args: unknown[] }[] })
      .expressions[0];
    assert.equal(call.callee, 'now');
  });

  it('parses nested array in key-value args', () => {
    const model = parseModelBody(
      'user: User @relation(name: "X", fields: [userId, id])',
    );
    const kv = assertKeyValueArgs(getAttr(getField(model, 'user'), 'relation').args);
    const fields = getKvPair(kv, 'fields').value;
    assert.equal(fields.kind, 'ArrayLiteral');
    assert.equal((fields as { elements: { name: string }[] }).elements.length, 2);
    assert.equal((fields as { elements: { name: string }[] }).elements[0].name, 'userId');
  });
});

describe('Parser — value disambiguation', () => {
  it('@default(gen_random_uuid()) uses ExpressionArgs, not KeyValueArgs', () => {
    const args = getDefaultArgs('id: UUID @default(gen_random_uuid())');
    assert.equal(args!.kind, 'ExpressionArgs');
  });

  it('@regex(pattern: "x") uses KeyValueArgs', () => {
    const args = getTestAttrArgs('x: INT @regex(pattern: "x")', 'regex');
    assert.equal(args!.kind, 'KeyValueArgs');
  });

  it('@relation(name: "X", fields: [id]) uses KeyValueArgs with array value', () => {
    const model = parseModelBody('user: User @relation(name: "X", fields: [id])');
    const kv = assertKeyValueArgs(getAttr(getField(model, 'user'), 'relation').args);
    assert.equal(getKvPair(kv, 'fields').value.kind, 'ArrayLiteral');
  });
});

function getModelAttrFromModel(model: ReturnType<typeof parseModelBody>, name: string) {
  const attr = model.attributes.find((a) => a.name === name);
  assert.ok(attr, `model attribute @${name} not found`);
  return attr;
}
