import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { ObjectValidator } from '../../src/validators/ObjectValidator';
import {
  ValidatorError,
  TObject,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.object();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('must be plain object', async () => {
  const validator = rule.object();

  await Promise.all(
    [
      new Date(),
      /x/,
      1,
      'x',
      [],
      true,
      new (class X {
        get [Symbol.toStringTag]() {
          return 'abc';
        }
      })(),
      '{}',
    ].map(async (value) => {
      await expect(
        Validator.validate(validator, { value }, 'value'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );

  await Promise.all(
    [{}, { hello: 'world' }, new (class X {})()].map(async (value) => {
      await expect(
        Validator.validate(validator, { value }, 'value'),
      ).to.resolves.toBeInstanceOf(Object);
    }),
  );
});

test('parse properties', async () => {
  const validator = rule.object({
    a: rule.number().min(10),
    b: rule.string(),
    c: rule.url().optional(),
    d: rule.string().default('hello'),
    e: rule.object({
      f: rule.number(),
    }),
  });

  await expect(
    Validator.validate(
      validator,
      { value: { a: 20, b: '', e: { f: 20, g: 30 }, f: 15 } },
      'value',
    ),
  ).to.resolves.toStrictEqual({
    a: 20,
    b: '',
    c: undefined,
    d: 'hello',
    e: {
      f: 20,
    },
  });
});

test('parse from string', async () => {
  const validator = rule.object().allowFromString();

  await expect(
    Validator.validate(validator, { value: '{"hello": "world"}' }, 'value'),
  ).to.resolves.toStrictEqual({ hello: 'world' });

  await expect(
    Validator.validate(validator, { value: '{hello: "world"}' }, 'value'),
  ).to.rejects.toThrowError(ValidatorError);
});

test('type checking', () => {
  const validator = rule.object();
  expect<TypeEqual<ObjectValidator<TObject>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<object>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, object>>(true);

  const optionalAndDefault = validator
    .optional()
    .default({})
    .transform((data) => {
      return expect<object>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, object>>(
    true,
  );

  const defaultAndOptional = validator
    .default({})
    .optional()
    .transform((data) => {
      return expect<object>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, object>>(
    true,
  );

  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, object | undefined>>(
    true,
  );
  const optionalWithTransform = optional.transform((data) => {
    return expect<object | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      object | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, object>>(
    false,
  );

  const hasDefault = validator.default({ x: 1 }).transform((data) => {
    return expect<object>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, object>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
