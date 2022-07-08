import { expectType, TypeEqual } from 'ts-expect';
import { assert, expect, test, vitest } from 'vitest';
import { query, manageSlots, rule } from '../../../src';
import { GetSlotType } from '../../../src/slot';
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

test('type checking', () => {
  const slot = query({
    a: rule.number(),
    b: rule.string().optional(),
    c: rule.object({
      d: rule.array(rule.boolean()),
    }),
  });

  expectType<
    TypeEqual<
      {
        readonly query: {
          a: number;
          b: string | undefined;
          c: { d: boolean[] };
        };
      },
      GetSlotType<typeof slot>
    >
  >(true);

  query({});
  // @ts-expect-error
  query();
  manageSlots('web').load(query({}));
  // @ts-expect-error
  manageSlots('console').load(query({}));
  // @ts-expect-error
  manageSlots('mixed').load(query({}));
});
