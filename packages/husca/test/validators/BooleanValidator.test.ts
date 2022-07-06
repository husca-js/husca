import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { BooleanValidator } from '../../src/validators/BoolenValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

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

test('type checking', () => {
  const validator = rule.boolean();
  expect<TypeEqual<BooleanValidator<boolean>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<boolean>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, boolean>>(true);

  const optionalAndDefault = validator
    .optional()
    .default('x')
    .transform((data) => {
      return expect<boolean>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, boolean>>(
    true,
  );

  const defaultAndOptional = validator
    .default('x')
    .optional()
    .transform((data) => {
      return expect<boolean>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, boolean>>(
    true,
  );

  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, boolean | undefined>>(
    true,
  );
  const optionalWithTransform = optional.transform((data) => {
    return expect<boolean | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      boolean | undefined
    >
  >(true);
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, boolean>
  >(false);

  const hasDefault = validator.default('').transform((data) => {
    return expect<boolean>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, boolean>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
