import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.string();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();

  expect(Validator.isEmpty(validator, '')).toBeFalsy();
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
    num: 123,
    bool: true,
  };

  const validator = rule.string();

  await Promise.all(
    Object.keys(invalidValues).map(async (key) => {
      await expect(
        Validator.validate(validator, invalidValues, key),
      ).rejects.toThrowError(ValidatorError);
    }),
  );
});

test('exactly length', async () => {
  const validator = rule.string().length(10);

  await expect(
    Validator.validate(validator, { str: '1' }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { str: '0123456789' }, 'str'),
  ).to.resolves.toBe('0123456789');
});

test('between length', () => {
  return Promise.all(
    [
      rule.string().length(5, 20),
      rule.string().length({ min: 5, max: 20 }),
    ].map(async (validator) => {
      let str: string = Array(4).fill('x').join('');
      await expect(
        Validator.validate(validator, { str }, 'str'),
      ).to.rejects.toThrowError(ValidatorError);

      str += 'x';
      await expect(
        Validator.validate(validator, { str }, 'str'),
      ).to.resolves.toBe(str);

      str = Array(20).fill('x').join('');
      await expect(
        Validator.validate(validator, { str }, 'str'),
      ).to.resolves.toBe(str);

      str += 'x';
      await expect(
        Validator.validate(validator, { str }, 'str'),
      ).to.rejects.toThrowError(ValidatorError);

      str = Array(12).fill('x').join('');
      await expect(
        Validator.validate(validator, { str }, 'str'),
      ).to.resolves.toBe(str);
    }),
  );
});

test('length only limit minimum', async () => {
  const validator = rule.string().length({ min: 25 });

  let str: string = Array(24).fill('x').join('');
  await expect(
    Validator.validate(validator, { str }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);

  str += 'x';
  await expect(Validator.validate(validator, { str }, 'str')).to.resolves.toBe(
    str,
  );

  str += Array(120).fill('x').join('');
  await expect(Validator.validate(validator, { str }, 'str')).to.resolves.toBe(
    str,
  );
});

test('length only limit maximum', async () => {
  const validator = rule.string().length({ max: 55 });

  let str: string = Array(54).fill('x').join('');
  await expect(Validator.validate(validator, { str }, 'str')).to.resolves.toBe(
    str,
  );

  str += 'x';
  await expect(Validator.validate(validator, { str }, 'str')).to.resolves.toBe(
    str,
  );

  str += 'x';
  await expect(
    Validator.validate(validator, { str }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);

  str += Array(120).fill('x').join('');
  await expect(
    Validator.validate(validator, { str }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);
});

test('trim whitespace before validate', async () => {
  const validator = rule.string().length(3);

  await expect(
    Validator.validate(validator, { str: '  123  ' }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator.trim(), { str: '  123  ' }, 'str'),
  ).to.resolves.toBe('123');
});

test('match givern regexp', async () => {
  const validator = rule.string().match(/^a.+b$/);

  await expect(
    Validator.validate(validator, { str: 'abc' }, 'str'),
  ).to.rejects.toThrowError(ValidatorError);

  await expect(
    Validator.validate(validator, { str: 'abacb' }, 'str'),
  ).to.resolves.toBe('abacb');
});
