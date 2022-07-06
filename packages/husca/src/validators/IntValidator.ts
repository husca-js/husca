import { BaseNumberValidator, NumberOptions } from './BaseNumberValidator';
import {
  TransformedValidator,
  TDefault,
  TOptional,
  ValidatorTransformFn,
  ParameterOrFn,
} from './Validator';

export class IntValidator<T = number> extends BaseNumberValidator<T> {
  protected declare config: NumberOptions<T>;

  constructor() {
    super();
    this.config.onlyInteger = true;
  }

  public declare optional: () => IntValidator<T | TOptional>;

  public declare default: (
    integer: ParameterOrFn<T>,
  ) => IntValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;
}
