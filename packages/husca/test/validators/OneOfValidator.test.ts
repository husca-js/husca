import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { OneOfValidator } from '../../src/validators/OneOfValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.oneOf(rule.number(), rule.string());

  expect(Validator.isEmpty(validator, null)).toBeFalsy();
  expect(Validator.isEmpty(validator, undefined)).toBeFalsy();
  expect(Validator.isEmpty(validator, '')).toBeFalsy();
  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('compose validators', async () => {
  const validator = rule.oneOf(rule.number(), rule.boolean(), rule.string());

  await expect(
    Validator.validate(validator, { value: 'x' }, 'value'),
  ).to.resolves.toBe('x');

  await expect(
    Validator.validate(validator, { value: '2' }, 'value'),
  ).to.resolves.toBe(2);

  await expect(
    Validator.validate(validator, { value: true }, 'value'),
  ).to.resolves.toBe(true);
  await expect(
    Validator.validate(validator, { value: 'true' }, 'value'),
  ).to.resolves.toBe(true);

  await expect(
    Validator.validate(validator, { value: [] }, 'value'),
  ).to.rejects.toThrowError(ValidatorError);
});

test('type checking', () => {
  const validator = rule.oneOf(rule.number(), rule.string());
  expect<TypeEqual<OneOfValidator<string | number>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<string | number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, string | number>>(true);
  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
