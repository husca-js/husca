import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { BooleanValidator } from '../../../src/validators/BoolenValidator';

const validator = rule.boolean();

describe('instance', () => {
  expectType<TypeEqual<BooleanValidator<boolean>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<boolean>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, boolean>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    .default('x')
    .transform((data) => {
      return expectType<boolean>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, boolean>>(
    true,
  );

  const defaultAndOptional = validator
    .default('x')
    .optional()
    .transform((data) => {
      return expectType<boolean>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, boolean>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, boolean | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<boolean | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      boolean | undefined
    >
  >(true);
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, boolean>
  >(false);
});

describe('default', () => {
  const hasDefault = validator.default('').transform((data) => {
    return expectType<boolean>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, boolean>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});
