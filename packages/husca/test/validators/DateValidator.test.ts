import { test, expect } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule, Validator } from '../../src';
import { DateValidator } from '../../src/validators/DateValidator';
import {
  ValidatorError,
  GetValidatorType,
  TransformedValidator,
} from '../../src/validators';

test('empty boundaries', () => {
  const validator = rule.datetime('');

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('normal date', async () => {
  const validator = rule.datetime('YYYY-MM-DD HH:mm:ss');

  await Promise.all(
    ['2022-07-03 17:41:17', '1980-07-03 17:41:00', new Date()].map(
      async (date) => {
        const result: Date = await Validator.validate(
          validator,
          { date },
          'date',
        );
        expect(result.toISOString()).toBe(new Date(date).toISOString());
      },
    ),
  );

  await Promise.all(
    [
      '0022-07-03 17:41:17',
      '22-07-03 17:41:17',
      '2022-07-03  17:41:00',
      '2022-07-03 17;41:00',
      '2022-07--03 17:41:00',
      '2022-07-03 41:00',
      '2022-07-03 17',
      '2022/07/03 17:41:17',
      '2022 17:41:17',
      'xxx',
      Date.now(),
      new Date('xxx'),
      {},
    ].map(async (date) => {
      await expect(
        Validator.validate(validator, { date }, 'date'),
      ).to.rejects.toThrowError(ValidatorError);
    }),
  );
});

test('min date', async () => {
  const validatorWithoutInclusive = rule
    .datetime('YYYY-MM-DD HH:mm:ss')
    .min(new Date('2000-01-01 00:00:00'), false);

  await expect(
    Validator.validate(
      validatorWithoutInclusive,
      { date: new Date('2000-01-01 00:00:00') },
      'date',
    ),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(
      validatorWithoutInclusive,
      { date: new Date('2000-01-01 00:00:01') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);

  const validatorWithInclusive = rule
    .datetime('YYYY-MM-DD HH:mm:ss')
    .min(() => new Date('2000-01-01 00:00:00'));

  await expect(
    Validator.validate(
      validatorWithInclusive,
      { date: new Date('2000-01-01 00:00:00') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);
  await expect(
    Validator.validate(
      validatorWithInclusive,
      { date: new Date('2000-01-01 00:00:01') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);
});

test('max date', async () => {
  const validatorWithoutInclusive = rule
    .datetime('YYYY-MM-DD HH:mm:ss')
    .max(new Date('2030-01-02 00:00:00'), false);

  await expect(
    Validator.validate(
      validatorWithoutInclusive,
      { date: new Date('2030-01-02 00:00:00') },
      'date',
    ),
  ).to.rejects.toThrowError(ValidatorError);
  await expect(
    Validator.validate(
      validatorWithoutInclusive,
      { date: new Date('2000-01-01 23:59:59') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);

  const validatorWithInclusive = rule
    .datetime('YYYY-MM-DD HH:mm:ss')
    .max(() => new Date('2030-01-02 00:00:00'));

  await expect(
    Validator.validate(
      validatorWithInclusive,
      { date: new Date('2030-01-02 00:00:00') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);
  await expect(
    Validator.validate(
      validatorWithInclusive,
      { date: new Date('2000-01-01 23:59:59') },
      'date',
    ),
  ).to.resolves.toBeInstanceOf(Date);
});

test.todo('date before 1970', async () => {});

test.todo('timezone', async () => {});

test('timestamp', async () => {
  const validator = rule.timestamp();

  await expect(
    Validator.validate(validator, { date: '2022-07-03 17:41:17' }, 'date'),
  ).to.rejects.toThrowError(ValidatorError);

  await expect(
    Validator.validate(validator, { date: Date.now() }, 'date'),
  ).to.resolves.toBeInstanceOf(Date);
});

test('type checking', () => {
  const validator = rule.datetime('');
  expect<TypeEqual<DateValidator<Date>, typeof validator>>(true);

  const normal = validator.transform((data) => {
    return expect<Date>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, Date>>(true);

  const optionalAndDefault = validator
    .optional()
    // @ts-expect-error
    .default('x')
    // @ts-expect-error
    .default(123)
    .default(new Date())
    .default(() => new Date())
    .transform((data) => {
      return expect<Date>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, Date>>(
    true,
  );

  const defaultAndOptional = validator
    .default(new Date())
    .optional()
    .transform((data) => {
      return expect<Date>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, Date>>(
    true,
  );

  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, Date | undefined>>(
    true,
  );
  const optionalWithTransform = optional.transform((data) => {
    return expect<Date | undefined>(data), data;
  });
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, Date | undefined>
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, Date>>(
    false,
  );

  const hasDefault = validator.default(new Date()).transform((data) => {
    return expect<Date>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, Date>>(true);

  expect<TransformedValidator<boolean>>(validator.transform(() => true));
});
