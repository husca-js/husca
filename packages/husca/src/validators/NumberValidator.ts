import { BaseNumberValidator, NumberOptions } from './BaseNumberValidator';
import {
  TDefault,
  TOptional,
  TransformedValidator,
  ParameterOrFn,
  ValidatorTransformFn,
} from './Validator';

export class NumberValidator<T = number> extends BaseNumberValidator<T> {
  protected declare config: NumberOptions<T>;

  public declare optional: () => NumberValidator<T | TOptional>;

  public declare default: (
    number: ParameterOrFn<T>,
  ) => NumberValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public precision(maxDecimals: number): this {
    this.config.precision = Math.min(20, Math.max(0, maxDecimals));
    return this;
  }
}
