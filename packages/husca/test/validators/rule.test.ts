import { test } from 'vitest';
import { expectType, TypeEqual } from 'ts-expect';
import { rule } from '../../src';
import { GetValidatorType } from '../../src/validators';

test('oneOf', () => {
  const validator1 = rule.oneOf(rule.number(), rule.string());
  expectType<TypeEqual<string | number, GetValidatorType<typeof validator1>>>(
    true,
  );

  const validator2 = rule.oneOf([rule.number(), rule.string()]);
  expectType<TypeEqual<string | number, GetValidatorType<typeof validator2>>>(
    true,
  );

  const validator3 = rule.oneOf(rule.number(), rule.string(), rule.boolean());
  expectType<
    TypeEqual<string | number | boolean, GetValidatorType<typeof validator3>>
  >(true);

  const validator4 = rule.oneOf(rule.number(), rule.string(), rule.number());
  expectType<TypeEqual<string | number, GetValidatorType<typeof validator4>>>(
    true,
  );

  const validator5 = rule.oneOf(
    rule.number(),
    rule.string(),
    rule.oneOf(rule.array(), rule.array(rule.string())),
  );
  expectType<
    TypeEqual<
      string | number | unknown[] | string[],
      GetValidatorType<typeof validator5>
    >
  >(true);

  rule.oneOf(rule.number(), rule.string());
  rule.oneOf(rule.number(), rule.string(), rule.boolean());
  rule.oneOf([rule.number(), rule.string()]);
  rule.oneOf([rule.number(), rule.string(), rule.boolean()]);

  // @ts-expect-error
  rule.oneOf();
  // @ts-expect-error
  rule.oneOf([]);
  // @ts-expect-error
  rule.oneOf(rule.number());
  // @ts-expect-error
  rule.oneOf([rule.number()]);
});

test('array', () => {
  const validator1 = rule.array();
  expectType<TypeEqual<unknown[], GetValidatorType<typeof validator1>>>(true);

  const validator2 = rule.array({
    xx: rule.number(),
  });
  expectType<TypeEqual<{ xx: number }[], GetValidatorType<typeof validator2>>>(
    true,
  );

  const validator3 = rule.array(rule.string());
  expectType<TypeEqual<string[], GetValidatorType<typeof validator3>>>(true);

  // @ts-expect-error
  rule.array([]);
  // @ts-expect-error
  rule.array(null);
  // @ts-expect-error
  rule.array(class {});
  // @ts-expect-error
  rule.array(rule.number);
});

test('json', () => {
  const validator1 = rule.object();
  expectType<TypeEqual<object, GetValidatorType<typeof validator1>>>(true);

  const validator2 = rule.object({});
  expectType<TypeEqual<object, GetValidatorType<typeof validator2>>>(true);

  const validator3 = rule.object({
    x: rule.number(),
  });
  expectType<TypeEqual<{ x: number }, GetValidatorType<typeof validator3>>>(
    true,
  );

  rule.object({
    // @ts-expect-error
    x: 20,
    // @ts-expect-error
    y: rule.string,
    // @ts-expect-error
    z: {},
  });
  // @ts-expect-error
  rule.object([]);
  // @ts-expect-error
  rule.object(2);
  // @ts-expect-error
  rule.object(new Date());
  // @ts-expect-error
  rule.object(new (class {})());
});

test('enum', () => {
  const validator = rule.enum(['a']);
  expectType<TypeEqual<'a', GetValidatorType<typeof validator>>>(true);
  rule.enum([20, '20', true, false]);

  // @ts-expect-error
  rule.enum();
  // @ts-expect-error
  rule.enum('');
  // @ts-expect-error
  rule.enum([{}]);
  // @ts-expect-error
  rule.enum([]);
  // @ts-expect-error
  rule.enum([Symbol('')]);
});

test('ip', () => {
  rule.ip('v4');
  rule.ip('v6');
  rule.ip(['v4', 'v6']);

  // @ts-expect-error
  rule.ip();
  // @ts-expect-error
  rule.ip('v5');
  // @ts-expect-error
  rule.ip([]);
  // @ts-expect-error
  rule.ip(['v5']);
  // @ts-expect-error
  rule.ip(0);
  // @ts-expect-error
  rule.ip({});
});
