import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { NumberValidator } from '../../../src/validators/NumberValidator';

const validator = rule.number();

describe('instance', () => {
  expectType<TypeEqual<NumberValidator<number>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, number>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    .default(5)
    .transform((data) => {
      return expectType<number>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, number>>(
    true,
  );

  const defaultAndOptional = validator
    .default(123)
    .optional()
    .transform((data) => {
      return expectType<number>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, number>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, number | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<number | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      number | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, number>>(
    false,
  );
});

describe('default', () => {
  const hasDefault = validator.default(3).transform((data) => {
    return expectType<number>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, number>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});
