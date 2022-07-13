import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { GetSlotType, manageSlots, options, rule } from '../../../src';

describe('with validator', () => {
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
});

describe('invalid usage', () => {
  options({});
  manageSlots('console').load(options({}));
  // @ts-expect-error
  options();
  // @ts-expect-error
  manageSlots('web').load(options({}));
  // @ts-expect-error
  manageSlots('mixed').load(options({}));
});
