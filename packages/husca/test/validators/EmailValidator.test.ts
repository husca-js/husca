import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { EmailValidator } from '../../src/validators/EmailValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.email();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('normal email', async () => {
  const validator = rule.email();

  await Promise.all(
    [
      'test@example.com',
      'test@example.com.cn.ok',
      'test.mail@example.cn',
      'test-mail@e.org',
      'test_mail@text.io',
    ].map(async (email) => {
      await expect(
        Validator.validate(validator, { email }, 'email'),
      ).to.resolves.toBe(email);
    }),
  );
});

test('invalid email', async () => {
  const validator = rule.email();

  await Promise.all(
    [
      20,
      'hello',
      Infinity,
      {},
      Symbol(),
      'test#example.com',
      'test@example.com.cn.',
      '@example.cn',
      'test-mail@example',
      'test-mail@example.x',
    ].map(async (email) => {
      await expect(
        Validator.validate(validator, { email }, 'email'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});

test('type checking', () => {
  const validator = rule.email();
  expect<TypeEqual<EmailValidator<string>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<string>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, string>>(true);

  const optionalAndDefault = validator
    .optional()
    .default('x')
    .transform((data) => {
      return expect<string>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, string>>(
    true,
  );

  const defaultAndOptional = validator
    .default('x')
    .optional()
    .transform((data) => {
      return expect<string>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, string>>(
    true,
  );

  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, string | undefined>>(
    true,
  );
  const optionalWithTransform = optional.transform((data) => {
    return expect<string | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      string | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, string>>(
    false,
  );

  const hasDefault = validator.default('').transform((data) => {
    return expect<string>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, string>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
