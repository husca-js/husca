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

interface EnumOptions<T> extends ValidatorOptions<T> {
  ranges: T[];
}

export class EnumValidator<T = never> extends Validator<T> {
  protected declare config: EnumOptions<T>;

  constructor(ranges: T[]) {
    super();
    this.config.ranges = ranges;
  }

  public declare optional: () => EnumValidator<T | TOptional>;

  public declare default: (
    value: ParameterOrFn<T>,
  ) => EnumValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  protected validateValue(value: any, key: string, superKeys: string[]): any {
    const { ranges } = this.config;

    if (!ranges.includes(value)) {
      throw new ValidatorError('{{label}} is not in range', key, superKeys);
    }

    return value;
  }
}
