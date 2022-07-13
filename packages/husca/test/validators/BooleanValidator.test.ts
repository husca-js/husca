import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.boolean();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('normal boolean', async () => {
  const validator = rule.boolean();

  await Promise.all(
    [1, '1', true, 'true'].map(async (value) => {
      await expect(
        Validator.validate(validator, { bool: value }, 'bool'),
      ).to.resolves.toBe(true);
    }),
  );

  await Promise.all(
    [0, '0', false, 'false'].map(async (value) => {
      await expect(
        Validator.validate(validator, { bool: value }, 'bool'),
      ).to.resolves.toBe(false);
    }),
  );
});

test('specific loose value', async () => {
  const validator = rule
    .boolean()
    .trueValues(['okay', true, 'yes'])
    .falseValues(['maya', 'oops', -1]);

  await Promise.all(
    ['okay', true, 'yes'].map(async (value) => {
      await expect(
        Validator.validate(validator, { bool: value }, 'bool'),
      ).to.resolves.toBe(true);
    }),
  );

  await Promise.all(
    ['maya', 'oops', -1].map(async (value) => {
      await expect(
        Validator.validate(validator, { bool: value }, 'bool'),
      ).to.resolves.toBe(false);
    }),
  );
});

test('invalid boolean', async () => {
  const validator = rule.boolean();

  await Promise.all(
    ['okay', 'yes', 2, {}, NaN, Infinity, Symbol()].map(async (value) => {
      await expect(
        Validator.validate(validator, { bool: value }, 'bool'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});
