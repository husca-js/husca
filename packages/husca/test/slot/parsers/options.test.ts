import { expectType, TypeEqual } from 'ts-expect';
import { assert, expect, test, vitest } from 'vitest';
import { options, manageSlots, rule } from '../../../src';
import { GetSlotType } from '../../../src/slot';
import { composeToMiddleware } from '../../../src/utils/compose';
import { ValidatorError } from '../../../src/validators';

test('set options onto context', async () => {
  const middleware = composeToMiddleware([
    options({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    request: {
      options: {
        test: 'x',
        test1: 'y',
      },
    },
  };

  await middleware(ctx);
  expect(ctx).haveOwnProperty('options');
  // @ts-ignore
  expect(ctx['options']).toStrictEqual({
    test: 'x',
  });
});

test('throw error when rule validation failed', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    options({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      options: {},
    },
  };

  await expect(middleware(ctx)).to.rejects.toThrowError(ValidatorError);
});

test('throw error when request.options is invalid', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    options({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      body: null,
    },
  };

  await expect(middleware(ctx)).to.rejects.toThrowError(Error);
});

test('regenerate source when alias is provided', async () => {
  const middleware = composeToMiddleware([
    options(
      {
        test: rule.string(),
      },
      {
        test: ['t'],
      },
    ),
  ]);
  const ctx = {
    request: {
      argv: '--t=x --test1=y',
    },
  };

  await middleware(ctx);
  // @ts-ignore
  expect(ctx['options']).toStrictEqual({
    test: 'x',
  });
});

test('type checking', () => {
  const slot = options({
    a: rule.number(),
    b: rule.string().optional(),
    c: rule.object({
      d: rule.array(rule.boolean()),
    }),
  });

  expectType<
    TypeEqual<
      {
        readonly options: {
          a: number;
          b: string | undefined;
          c: { d: boolean[] };
        };
      },
      GetSlotType<typeof slot>
    >
  >(true);

  options({});
  // @ts-expect-error
  options();
  manageSlots('console').load(options({}));
  // @ts-expect-error
  manageSlots('web').load(options({}));
  // @ts-expect-error
  manageSlots('mixed').load(options({}));
});
