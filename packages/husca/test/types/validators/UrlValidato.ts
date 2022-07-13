import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { UrlValidator } from '../../../src/validators/UrlValidator';

const validator = rule.url();

describe('instance', () => {
  expectType<TypeEqual<UrlValidator<string>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<string>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, string>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    .default('x')
    .transform((data) => {
      return expectType<string>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, string>>(
    true,
  );

  const defaultAndOptional = validator
    .default('x')
    .optional()
    .transform((data) => {
      return expectType<string>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, string>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, string | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<string | undefined>(data), data;
  });
  expectType<
    TypeEqual<
      GetValidatorType<typeof optionalWithTransform>,
      string | undefined
    >
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, string>>(
    false,
  );
});

describe('default', () => {
  const hasDefault = validator.default('').transform((data) => {
    return expectType<string>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, string>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});
