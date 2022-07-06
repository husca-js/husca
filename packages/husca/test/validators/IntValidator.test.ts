import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { IntValidator } from '../../src/validators/IntValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

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

test('type checking', () => {
  const validator = rule.int();
  expect<TypeEqual<IntValidator<number>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, number>>(true);

  const optionalAndDefault = validator
    .optional()
    .default(5)
    .transform((data) => {
      return expect<number>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, number>>(
    true,
  );

  const defaultAndOptional = validator
    .default(123)
    .optional()
    .transform((data) => {
      return expect<number>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, number>>(
    true,
  );

  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, number | undefined>>(
    true,
  );
  const optionalWithTransform = optional.transform((data) => {
    return expect<number | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      number | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, number>>(
    false,
  );

  const hasDefault = validator.default(3).transform((data) => {
    return expect<number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, number>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
