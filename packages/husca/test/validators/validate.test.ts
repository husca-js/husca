import { expect, test } from 'vitest';
import { rule, validate } from '../../src';

test('only support object source', async () => {
  await Promise.all(
    [2, '10', true, null, undefined, Symbol()].map(async (values) => {
      await expect(validate(values, {})).rejects.toThrowError(Error);
    }),
  );

  await Promise.all(
    [[], {}, new Date(), /x/].map(async (values) => {
      const result = await validate(values, {});
      expect(Object.prototype.toString.call(result)).toBe('[object Object]');
    }),
  );
});

test('rules', async () => {
  const source = {
    num: '20',
    str: 'test-str',
    ip: 'xxx',
  };
  const promiseSource = Promise.resolve().then(() => source);

  await Promise.all(
    [source, promiseSource].map(async (values) => {
      const result = await validate(values, {
        num: rule.number().min(10),
        str: rule.string(),
      });

      expect(result).not.toHaveProperty('ip');
      expect(result).toMatchObject({
        num: 20,
        str: 'test-str',
      });
    }),
  );
});
