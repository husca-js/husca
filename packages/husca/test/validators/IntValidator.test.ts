import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

test('only integer', async () => {
  const validator = rule.int();

  await Promise.all(
    [1, -0, 0, '-22', 13450].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.resolves.toBe(Number(num));
    }),
  );

  await Promise.all(
    [1.1, -0.2, '-1.1', '2.43'].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});
