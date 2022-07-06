import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { UrlValidator } from '../../src/validators/UrlValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.url();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('normal url', async () => {
  const validator = rule.url();

  await Promise.all(
    [
      'http://www.example.com',
      'https://www.example.com',
      'http://www.example.com/a/b/c',
      'http://example.com',
      'http:/www.example.com',
      'https:www.example.com',
      'http://example',
    ].map(async (url) => {
      await expect(
        Validator.validate(validator, { url }, 'url'),
      ).to.resolves.toBe(url);
    }),
  );
});

test('invalid url', async () => {
  const validator = rule.url();

  await Promise.all(
    [
      20,
      NaN,
      false,
      'ok',
      'https//www.example.com',
      'http1://www.example.com/a/b/c',
      '//example.com/a',
      'ftp://www.example.com',
      'www.example.com',
    ].map(async (url) => {
      await expect(
        Validator.validate(validator, { url }, 'url'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});

test('specific schemes', async () => {
  const validator = rule.url().schemes(['http', 'link', 'ftp', 'custom']);

  await Promise.all(
    [
      'link://www.example.com',
      'custom://www.example.com',
      'ftp://www.example.com/a/b/c',
      'http://example.com',
    ].map(async (url) => {
      await expect(
        Validator.validate(validator, { url }, 'url'),
      ).to.resolves.toBe(url);
    }),
  );
});

test('auto complete scheme', async () => {
  const validator = rule.url().schemes(['http', 'ftp']).autoComplete('ftp');
  await expect(
    Validator.validate(validator, { url: 'www.example.com' }, 'url'),
  ).to.resolves.toBe('ftp://www.example.com');
});

test('type checking', () => {
  const validator = rule.url();
  expect<TypeEqual<UrlValidator<string>, typeof validator>>(true);

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
