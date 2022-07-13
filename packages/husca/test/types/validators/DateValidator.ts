import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { DateValidator } from '../../../src/validators/DateValidator';

const validator = rule.datetime('');

describe('instance', () => {
  expectType<TypeEqual<DateValidator<Date>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<Date>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, Date>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    // @ts-expect-error
    .default('x')
    // @ts-expect-error
    .default(123)
    .default(new Date())
    .default(() => new Date())
    .transform((data) => {
      return expectType<Date>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof optionalAndDefault>, Date>>(
    true,
  );

  const defaultAndOptional = validator
    .default(new Date())
    .optional()
    .transform((data) => {
      return expectType<Date>(data), data;
    });
  expectType<TypeEqual<GetValidatorType<typeof defaultAndOptional>, Date>>(
    true,
  );
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, Date | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<Date | undefined>(data), data;
  });
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, Date | undefined>
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, Date>>(
    false,
  );
});

describe('default', () => {
  const hasDefault = validator.default(new Date()).transform((data) => {
    return expectType<Date>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, Date>>(true);
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});
