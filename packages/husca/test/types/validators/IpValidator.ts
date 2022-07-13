import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { IpValidator } from '../../../src/validators/IpValidator';

const validator = rule.ip('v4');

describe('instance', () => {
  expectType<TypeEqual<IpValidator<string>, typeof validator>>(true);
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

describe('invalid usage', () => {
  rule.ip('v4');
  rule.ip('v6');
  rule.ip(['v4']);
  rule.ip(['v6']);
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
  rule.ip(['v5', 'v4']);
  // @ts-expect-error
  rule.ip(0);
  // @ts-expect-error
  rule.ip({});
});
