import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { GetSlotType, manageSlots, params, rule } from '../../../src';

describe('with validator', () => {
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
});

describe('invalid usage', () => {
  params({});
  // @ts-expect-error
  params();
  manageSlots().load(params({}));
  // @ts-expect-error
  manageSlots('console').load(params({}));
  // @ts-expect-error
  manageSlots('mixed').load(params({}));
});
