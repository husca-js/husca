import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { ArrayValidator } from '../../../src/validators/ArrayValidator';

const validator = rule.array();

describe('instance', () => {
  expectType<TypeEqual<ArrayValidator<unknown[]>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<unknown[]>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, unknown[]>>(true);

  const validator2 = rule.array({
    xx: rule.number(),
  });
  expectType<TypeEqual<{ xx: number }[], GetValidatorType<typeof validator2>>>(
    true,
  );

  const validator3 = rule.array(rule.string());
  expectType<TypeEqual<string[], GetValidatorType<typeof validator3>>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    .default([])
    .transform((data) => {
      return expectType<unknown[]>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, unknown[]>>(
    true,
  );

  const defaultAndOptional = validator
    .default([])
    .optional()
    .transform((data) => {
      return expectType<unknown[]>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, unknown[]>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<
    TypeEqual<GetValidatorType<typeof optional>, unknown[] | undefined>
  >(true);
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<unknown[] | undefined>(data), data;
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
});

describe('default', () => {
  const hasDefault = validator.default([]).transform((data) => {
    return expectType<unknown[]>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, unknown[]>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});

describe('invalid usage', () => {
  // @ts-expect-error
  rule.array([]);
  // @ts-expect-error
  rule.array(null);
  // @ts-expect-error
  rule.array(class {});
  // @ts-expect-error
  rule.array(rule.number);
});
