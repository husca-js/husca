import emailValidator from 'email-validator';
import {
  TDefault,
  TOptional,
  TransformedValidator,
  Validator,
  ParameterOrFn,
  ValidatorOptions,
  ValidatorTransformFn,
} from './Validator';
import { ValidatorError } from './ValidatorError';

interface EmailOptions<T> extends ValidatorOptions<T> {}

export class EmailValidator<T = string> extends Validator<T> {
  protected declare config: EmailOptions<T>;

  public declare optional: () => EmailValidator<T | TOptional>;

  public declare default: (
    email: ParameterOrFn<T>,
  ) => EmailValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  protected validateValue(
    email: any,
    key: string,
    superKeys: string[],
  ): string {
    if (typeof email !== 'string' || !emailValidator.validate(email)) {
      throw new ValidatorError('{{label}} must be email', key, superKeys);
    }

    return email;
  }
}
