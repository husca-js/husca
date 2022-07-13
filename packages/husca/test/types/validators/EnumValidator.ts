import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { EnumValidator } from '../../../src/validators/EnumValidator';

const validator = rule.enum(['a', 2, true]);

describe('instance', () => {
  expectType<TypeEqual<EnumValidator<'a' | 2 | true>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<'a' | 2 | true>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, 'a' | 2 | true>>(true);
});

describe('optional & default', () => {
  const optionalAndDefault = validator
    .optional()
    // @ts-expect-error
    .default('x')
    // @ts-expect-error
    .default(false)
    .default('a')
    .default(2)
    .default(true)
    .transform((data) => {
      return expectType<'a' | 2 | true>(data), data;
    });
  expectType<
    TypeEqual<GetValidatorType<typeof optionalAndDefault>, 'a' | 2 | true>
  >(true);

  const defaultAndOptional = validator
    .default('a')
    .optional()
    .transform((data) => {
      return expectType<'a' | 2 | true>(data), data;
    });
  expectType<
    TypeEqual<GetValidatorType<typeof defaultAndOptional>, 'a' | 2 | true>
  >(true);
});

describe('optional', () => {
  const optional = validator.optional().transform((data) => {
    return expectType<'a' | 2 | true | undefined>(data), data;
  });
  expectType<
    TypeEqual<GetValidatorType<typeof optional>, 'a' | 2 | true | undefined>
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optional>, 'a' | 2 | true>>(
    false,
  );
});

describe('default', () => {
  const hasDefault = validator.default('a').transform((data) => {
    return expectType<'a' | 2 | true>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof hasDefault>, 'a' | 2 | true>>(
    true,
  );
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});

describe('invalid usage', () => {
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
