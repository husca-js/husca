import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

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
