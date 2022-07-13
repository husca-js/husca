import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ValidatorError } from '../../src/validators';

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
