import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import {
  rule,
  TObject,
  GetValidatorType,
  TransformedValidator,
} from '../../../src';
import { ObjectValidator } from '../../../src/validators/ObjectValidator';

const validator = rule.object();

describe('instance', () => {
  expectType<TypeEqual<ObjectValidator<TObject>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<object>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, object>>(true);

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
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    .default({})
    .transform((data) => {
      return expectType<object>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, object>>(
    true,
  );

  const defaultAndOptional = validator
    .default({})
    .optional()
    .transform((data) => {
      return expectType<object>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, object>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, object | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<object | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      object | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, object>>(
    false,
  );
});

describe('default', () => {
  const hasDefault = validator.default({ x: 1 }).transform((data) => {
    return expectType<object>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, object>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});

describe('invalid usage', () => {
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
