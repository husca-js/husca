import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { body, GetSlotType, manageSlots, rule } from '../../../src';

describe('with validator', () => {
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
});

describe('invalid usage', () => {
  body({});
  // @ts-expect-error
  body();
  manageSlots().load(body({}));
  // @ts-expect-error
  manageSlots('console').load(body({}));
  // @ts-expect-error
  manageSlots('mixed').load(body({}));
});
