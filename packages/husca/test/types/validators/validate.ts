import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { validate, rule } from '../../../src';

describe('validate', async () => {
  const result = await validate(
    {},
    {
      num: rule.number(),
      opNum: rule.number().optional(),
      str: rule.string().default('').optional(),
    },
  );

  expectType<
    TypeEqual<
      { num: number; opNum: number | undefined; str: string },
      typeof result
    >
  >(true);
});
