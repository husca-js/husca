import { expectType, TypeEqual } from 'ts-expect';
import { assert, expect, test, vitest } from 'vitest';
import { params, manageSlots, rule } from '../../../src';
import { GetSlotType } from '../../../src/slot';
import { composeToMiddleware } from '../../../src/utils/compose';
import { ValidatorError } from '../../../src/validators';

test('set params onto context', async () => {
  const middleware = composeToMiddleware([
    params({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    request: {
      params: {
        test: 'x',
        test1: 'y',
      },
    },
  };

  await middleware(ctx);
  expect(ctx).haveOwnProperty('params');
  // @ts-ignore
  expect(ctx['params']).toStrictEqual({
    test: 'x',
  });
});

test('throw error when rule validation failed', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    params({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      params: {},
    },
  };

  await expect(middleware(ctx)).to.rejects.toThrowError(ValidatorError);
});

test('throw error when request.body is invalid', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    params({
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
  const slot = params({
    a: rule.number(),
    b: rule.string().optional(),
    c: rule.object({
      d: rule.array(rule.boolean()),
    }),
  });

  expectType<
    TypeEqual<
      {
        readonly params: {
          a: number;
          b: string | undefined;
          c: { d: boolean[] };
        };
      },
      GetSlotType<typeof slot>
    >
  >(true);

  params({});
  // @ts-expect-error
  params();
  manageSlots('web').load(params({}));
  // @ts-expect-error
  manageSlots('console').load(params({}));
  // @ts-expect-error
  manageSlots('mixed').load(params({}));
});
