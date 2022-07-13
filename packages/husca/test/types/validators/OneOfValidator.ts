import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { OneOfValidator } from '../../../src/validators/OneOfValidator';

const validator = rule.oneOf(rule.number(), rule.string());

describe('instance', () => {
  expectType<TypeEqual<OneOfValidator<string | number>, typeof validator>>(
    true,
  );
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<string | number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, string | number>>(true);

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
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});

describe('invalid usage', () => {
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
