import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.enum(['']);

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('custom enum values', async () => {
  const validator = rule.enum(['h', 1, 2, true]);

  await Promise.all(
    ['h', 1, 2, true].map(async (value) => {
      await expect(
        Validator.validate(validator, { range: value }, 'range'),
      ).to.resolves.toBe(value);
    }),
  );

  await Promise.all(
    ['H', '1', '2', 5, NaN, false, {}].map(async (value) => {
      await expect(
        Validator.validate(validator, { range: value }, 'range'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});
