import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.number();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('from other types', async () => {
  const invalidValues = {
    obj: {},
    arr: [],
    date: new Date(),
    nil: null,
    udf: undefined,
    reg: /x/,
    nan: NaN,
    inf: Infinity,
    bool: true,
  };

  const validator = rule.number();

  await Promise.all(
    Object.keys(invalidValues).map(async (key) => {
      await expect(
        Validator.validate(validator, invalidValues, key),
      ).rejects.toThrowError(ValidatorError);
    }),
  );
});

test('from string', async () => {
  const validator = rule.number();

  await expect(
    Validator.validate(validator, { str: '012' }, 'str'),
  ).to.resolves.toBe(12);
  await expect(
    Validator.validate(validator, { str: '2e3' }, 'str'),
  ).to.resolves.toBe(2000);

  await expect(
    Validator.validate(validator, { str: '0x2' }, 'str'),
  ).to.resolves.toBe(2);

  await expect(
    Validator.validate(validator, { str: 'a2e3' }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);
});

test('min and max limitation', async () => {
  const validator = rule.number().min(5).max(20);
  await Promise.all(
    [4.9999, 3, 21, 20.00001, 22, 123].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );

  await Promise.all(
    [5, 5.000001, 8, 19, 20, 19.99999].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.resolves.toBe(num);
    }),
  );
});

test('min and max limitation without inclusive', async () => {
  const validator = rule.number().min(5, false).max(20, false);
  await Promise.all(
    [5, 3, 21, 20, 22, 123].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );

  await Promise.all(
    [5.000001, 8, 19, 19.99999].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.resolves.toBe(num);
    }),
  );
});

test('percision', async () => {
  const validator = rule.number().precision(3);

  await Promise.all(
    [3, 3.1, 3.12, 3.123].map(async (num) => {
      await expect(
        Validator.validate(validator, { num }, 'num'),
      ).to.resolves.toBe(num);
    }),
  );

  await expect(
    Validator.validate(validator, { num: '3.1230000' }, 'num'),
  ).to.resolves.toBe(3.123);
  await expect(
    Validator.validate(validator, { num: '3e-2' }, 'num'),
  ).to.resolves.toBe(0.03);
  await expect(
    Validator.validate(validator, { num: '3.1e-2' }, 'num'),
  ).to.resolves.toBe(0.031);

  await expect(
    Validator.validate(validator, { num: '3e-4' }, 'num'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { num: 3.1234 }, 'num'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { num: 3.12345 }, 'num'),
  ).to.rejects.toThrowError(ValidatorError);
});
