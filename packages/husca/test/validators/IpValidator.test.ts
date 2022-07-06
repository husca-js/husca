import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { IpValidator } from '../../src/validators/IpValidator';
import { ipData } from '../mocks/ip';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.ip('v4');

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('ip v4', async () => {
  const validator = rule.ip('v4');

  await Promise.all(
    ipData.ip4.map((ip) => {
      return expect(Validator.validate(validator, { ip }, 'ip')).resolves.toBe(
        ip,
      );
    }),
  );

  await Promise.all(
    ipData.invalidIp4.map((ip) => {
      return expect(
        Validator.validate(validator, { ip }, 'ip'),
      ).rejects.toThrowError(ValidatorError);
    }),
  );
});

test('ip v6', async () => {
  const validator = rule.ip('v6');

  await Promise.all(
    ipData.ip6.map((ip) => {
      return expect(Validator.validate(validator, { ip }, 'ip')).resolves.toBe(
        ip,
      );
    }),
  );
});

test('ip v4 + v6', async () => {
  const validator = rule.ip(['v4', 'v6']);

  await Promise.all(
    [...ipData.ip4, ...ipData.ip6].map((ip) => {
      return expect(Validator.validate(validator, { ip }, 'ip')).resolves.toBe(
        ip,
      );
    }),
  );
});

test('type checking', () => {
  const validator = rule.ip('v4');
  expect<TypeEqual<IpValidator<string>, typeof validator>>(true);

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
