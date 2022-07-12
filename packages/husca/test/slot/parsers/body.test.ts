import { expectType, TypeEqual } from 'ts-expect';
import { assert, expect, test, vitest } from 'vitest';
import { body, manageSlots, rule } from '../../../src';
import { GetSlotType } from '../../../src/slot';
import { composeToMiddleware } from '../../../src/utils/compose';
import { ValidatorError } from '../../../src/validators';

test('set body onto context', async () => {
  const middleware = composeToMiddleware([
    body({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    request: {
      body: {
        test: 'x',
        test1: 'y',
      },
    },
  };

  await middleware(ctx);
  expect(ctx).haveOwnProperty('body');
  // @ts-ignore
  expect(ctx['body']).toStrictEqual({
    test: 'x',
  });
});

test('throw error when rule validation failed', async () => {
  const spy = vitest.fn().mockImplementation((code, error) => {
    assert(typeof code === 'number');
    throw error;
  });
  const middleware = composeToMiddleware([
    body({
      test: rule.string(),
    }),
  ]);
  const ctx = {
    throw: spy,
    request: {
      body: {},
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
    body({
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
  const slot = body({
    a: rule.number(),
    b: rule.string().optional(),
    c: rule.object({
      d: rule.array(rule.boolean()),
    }),
  });

  expectType<
    TypeEqual<
      {
        readonly body: {
          a: number;
          b: string | undefined;
          c: { d: boolean[] };
        };
      },
      GetSlotType<typeof slot>
    >
  >(true);

  body({});
  // @ts-expect-error
  body();
  manageSlots().load(body({}));
  // @ts-expect-error
  manageSlots('console').load(body({}));
  // @ts-expect-error
  manageSlots('mixed').load(body({}));
});
