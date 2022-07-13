import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { query, rule, GetSlotType, manageSlots } from '../../../src';

describe('with validator', () => {
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
});

describe('invalid usage', () => {
  query({});
  // @ts-expect-error
  query();
  manageSlots().load(query({}));
  // @ts-expect-error
  manageSlots('console').load(query({}));
  // @ts-expect-error
  manageSlots('mixed').load(query({}));
});
