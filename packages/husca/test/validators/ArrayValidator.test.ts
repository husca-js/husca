import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { ArrayValidator } from '../../src/validators/ArrayValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.array();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('must be array', async () => {
  const validator = rule.array();

  await Promise.all(
    [new Date(), /x/, 1, 'x', {}, true, Symbol()].map(async (value) => {
      await expect(
        Validator.validate(validator, { value }, 'value'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );

  await Promise.all(
    [[], Array(3), [1, '2', 'x']].map(async (value) => {
      await expect(
        Validator.validate(validator, { value }, 'value'),
      ).to.resolves.toBeInstanceOf(Array);
    }),
  );
});

test('exactly item length', async () => {
  const validator = rule.array().length(10);
  await expect(
    Validator.validate(validator, { arr: [] }, 'arr'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { arr: Array(9) }, 'arr'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { arr: Array(11) }, 'arr'),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(validator, { arr: Array(10) }, 'arr'),
  ).to.resolves.toBeInstanceOf(Array);
});

test('between item length', async () => {
  for (const validator of [
    rule.array().length(2, 5),
    rule.array().length({ min: 2, max: 5 }),
  ]) {
    await expect(
      Validator.validate(validator, { arr: [1] }, 'arr'),
    ).to.rejects.toThrowError(ValidatorError);

    for (let i = 2; i <= 5; ++i) {
      await expect(
        Validator.validate(validator, { arr: Array(i) }, 'arr'),
      ).to.resolves.toBeInstanceOf(Array);
    }

    await expect(
      Validator.validate(validator, { arr: Array(6) }, 'arr'),
    ).to.rejects.toThrowError(ValidatorError);
  }
});

test('parse items', async () => {
  const validator = rule.array(rule.number());

  await Promise.all(
    [[new Date()], [/x/], ['x'], [{}], [true], [1, 'x']].map(async (value) => {
      await expect(
        Validator.validate(validator, { value }, 'value'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );

  await expect(
    Validator.validate(validator, { arr: [] }, 'arr'),
  ).to.resolves.toBeInstanceOf(Array);
  await expect(
    Validator.validate(validator, { arr: ['1', 2, 3] }, 'arr'),
  ).to.resolves.toMatchObject([1, 2, 3]);
});

test('type checking', () => {
  const validator = rule.array();
  expect<TypeEqual<ArrayValidator<unknown[]>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<unknown[]>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, unknown[]>>(true);

  const optionalAndDefault = validator
    .optional()
    .default([])
    .transform((data) => {
      return expect<unknown[]>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, unknown[]>>(
    true,
  );

  const defaultAndOptional = validator
    .default([])
    .optional()
    .transform((data) => {
      return expect<unknown[]>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, unknown[]>>(
    true,
  );

  const optional = validator.optional();
  expectType<
    TypeEqual<GetValidatorType<typeof optional>, unknown[] | undefined>
  >(true);
  const optionalWithTransform = optional.transform((data) => {
    return expect<unknown[] | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      unknown[] | undefined
    >
  >(true);
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, unknown[]>
  >(false);

  const hasDefault = validator.default([]).transform((data) => {
    return expect<unknown[]>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, unknown[]>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
