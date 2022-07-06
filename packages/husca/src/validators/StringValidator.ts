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

interface StringOptions<T> extends ValidatorOptions<T> {
  lengthRange: { min?: number; max?: number };
  pattern?: RegExp;
  trim?: boolean;
}

export class StringValidator<T = string> extends Validator<T> {
  protected declare config: StringOptions<T>;

  constructor() {
    super();
    this.config.lengthRange = {};
  }

  public declare optional: () => StringValidator<T | TOptional>;

  public declare default: (
    string: ParameterOrFn<T>,
  ) => StringValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  length(exactLength: number): this;
  length(min: number, max: number): this;
  length(between: { min?: number; max?: number }): this;
  length(min: number | { min?: number; max?: number }, max?: number) {
    if (typeof min === 'number') {
      this.config.lengthRange = {
        min: min,
        max: typeof max === 'number' ? max : min,
      };
    } else {
      this.config.lengthRange = min;
    }

    return this;
  }

  trim(): this {
    this.config.trim = true;
    return this;
  }

  match(pattern: RegExp): this {
    this.config.pattern = pattern;
    return this;
  }

  protected override isEmpty(value: any): boolean {
    return value == null;
  }

  protected validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): string {
    const {
      lengthRange: { min = 0, max = Infinity },
      pattern,
      trim,
    } = this.config;

    if (typeof value !== 'string') {
      throw new ValidatorError('{{label}} must be string', key, superKeys);
    }

    if (trim) {
      value = value.trim();
    }

    const length = value.length;

    if (length < min || length > max) {
      throw new ValidatorError(
        `{{label}} has too many or too few characters`,
        key,
        superKeys,
      );
    }

    if (pattern && !pattern.test(value)) {
      throw new ValidatorError(
        '{{label}} fail to match regular expression',
        key,
        superKeys,
      );
    }

    return value;
  }
}
