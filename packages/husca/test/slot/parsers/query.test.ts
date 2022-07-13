import { assert, expect, test, vitest } from 'vitest';
import { query, rule } from '../../../src';
import { composeToMiddleware } from '../../../src/utils/compose';
import { ValidatorError } from '../../../src/validators';

test('set query onto context', async () => {
  const middleware = composeToMiddleware([
    query({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    request: {
      query: {
        test: 'x',
        test1: 'y',
      },
    },
  };

  await middleware(ctx);
  expect(ctx).haveOwnProperty('query');
  // @ts-ignore
  expect(ctx['query']).toStrictEqual({
    test: 'x',
  });
});

test('throw error when rule validation failed', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    query({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      query: {},
    },
  };

  await expect(middleware(ctx)).to.rejects.toThrowError(ValidatorError);
});

test('throw error when request.query is invalid', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    query({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      body: '',
    },
  };

  await expect(middleware(ctx)).to.rejects.toThrowError(Error);
});
