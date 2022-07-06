import { expectType, TypeEqual } from 'ts-expect';
import { test } from 'vitest';
import { body, manageSlots, rule } from '../../../src';
import { GetSlotType } from '../../../src/slot';

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
  manageSlots('web').load(body({}));
  // @ts-expect-error
  manageSlots('console').load(body({}));
  // @ts-expect-error
  manageSlots('mixed').load(body({}));
});
