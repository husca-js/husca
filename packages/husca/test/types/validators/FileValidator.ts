import { TypeEqual, expectType } from 'ts-expect';
import { describe } from 'vitest';
import { rule, GetValidatorType, TransformedValidator } from '../../../src';
import { File, FileValidator } from '../../../src/validators/FileValidator';

const validator = rule.file();

describe('instance', () => {
  expectType<TypeEqual<FileValidator<File>, typeof validator>>(true);
});

describe('generic', () => {
  const normal = validator.transform((data) => {
    return expectType<File>(data), data;
  });
  expectType<TypeEqual<GetValidatorType<typeof normal>, File>>(true);
});

describe('optional', () => {
  const optional = validator.optional();
  expectType<TypeEqual<GetValidatorType<typeof optional>, File | undefined>>(
    true,
  );
});

describe('optional with transform', () => {
  const optionalWithTransform = validator.optional().transform((data) => {
    return expectType<File | undefined>(data), data;
  });
  expectType<
    TypeEqual<GetValidatorType<typeof optionalWithTransform>, File | undefined>
  >(true);
  expectType<TypeEqual<GetValidatorType<typeof optionalWithTransform>, string>>(
    false,
  );
});

describe('transform', () => {
  expectType<TransformedValidator<boolean>>(validator.transform(() => true));
  expectType<TransformedValidator<number>>(validator.transform(() => 123));
});
