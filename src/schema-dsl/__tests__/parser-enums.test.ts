import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSnippet } from './helpers.js';

describe('Parser — enums', () => {
  it('parses basic enum with multiple values', () => {
    const schema = parseSnippet(
      'extensions {}\nenums { UserRole { ADMIN, USER, PUBLIC } }\nmodels {}',
    );
    assert.equal(schema.enums.length, 1);
    assert.equal(schema.enums[0].name, 'UserRole');
    assert.deepEqual(schema.enums[0].values, ['ADMIN', 'USER', 'PUBLIC']);
  });

  it('parses enum with trailing comma', () => {
    const schema = parseSnippet('extensions {}\nenums { Status { A, B, } }\nmodels {}');
    assert.deepEqual(schema.enums[0].values, ['A', 'B']);
  });

  it('parses enum with single value', () => {
    const schema = parseSnippet('extensions {}\nenums { Flag { ON } }\nmodels {}');
    assert.deepEqual(schema.enums[0].values, ['ON']);
  });
});
