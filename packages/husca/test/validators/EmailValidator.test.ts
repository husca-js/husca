import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

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
