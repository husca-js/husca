import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { EnumValidator } from '../../src/validators/EnumValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

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

test('type checking', () => {
  const validator = rule.enum(['a', 2, true]);
  expect<TypeEqual<EnumValidator<'a' | 2 | true>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<'a' | 2 | true>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, 'a' | 2 | true>>(true);

  const optionalAndDefault = validator
    .optional()
    // @ts-expect-error
    .default('x')
    // @ts-expect-error
    .default(false)
    .default('a')
    .default(2)
    .default(true)
    .transform((data) => {
      return expect<'a' | 2 | true>(data), data;
    });
  expectType<
    TypeEqual<GetValidatorType<typeof optionalAndDefault>, 'a' | 2 | true>
  >(true);

  const defaultAndOptional = validator
    .default('a')
    .optional()
    .transform((data) => {
      return expect<'a' | 2 | true>(data), data;
    });
  expectType<
    TypeEqual<GetValidatorType<typeof defaultAndOptional>, 'a' | 2 | true>
  >(true);

  const optional = validator.optional().transform((data) => {
    return expect<'a' | 2 | true | undefined>(data), data;
  });
  expectType<
    TypeEqual<GetValidatorType<typeof optional>, 'a' | 2 | true | undefined>
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optional>, 'a' | 2 | true>>(
    false,
  );

  const hasDefault = validator.default('a').transform((data) => {
    return expect<'a' | 2 | true>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, 'a' | 2 | true>>(
    true,
  );

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
