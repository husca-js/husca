import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import { ipData } from '../mocks/ip';
import { ValidatorError } from '../../src/validators';

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
