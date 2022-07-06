import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { UuidValidator } from '../../src/validators/UuidValidator';
import { uuidData } from '../mocks/uuid';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

const getMaps = (fn: (validator: UuidValidator) => UuidValidator) => {
  return [
    fn(rule.uuid('v1')),
    fn(rule.uuid('v2')),
    fn(rule.uuid('v3')),
    fn(rule.uuid('v4')),
    fn(rule.uuid('v5')),
    fn(rule.uuid(['v1', 'v2', 'v3', 'v4', 'v5'])),
  ];
};

test('empty boundaries', () => {
  const validator = rule.uuid('v4');

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('normal uuid', async () => {
  await Promise.all(
    getMaps((v) => v).map(async (validator, index, arr) => {
      const uuids =
        uuidData['uuid' + (arr.length === index + 1 ? 'all' : index + 1)]!;
      await Promise.all(
        uuids.map(async (uuid) => {
          await expect(
            Validator.validate(validator, { uuid }, 'uuid'),
          ).resolves.toBe(uuid);
        }),
      );
    }),
  );
});

test('invalid uuid', async () => {
  await Promise.all(
    getMaps((v) => v).map(async (validator) => {
      const uuids = uuidData['invalid']!;
      await Promise.all(
        uuids.map(async (uuid) => {
          await expect(
            Validator.validate(validator, { uuid }, 'uuid'),
          ).rejects.toThrowError(ValidatorError);
        }),
      );
    }),
  );
});

test('type checking', () => {
  const validator = rule.uuid('v4');
  expect<TypeEqual<UuidValidator<string>, typeof validator>>(true);

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
