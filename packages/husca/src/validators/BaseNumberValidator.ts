import { Validator, ValidatorOptions } from './Validator';
import { ValidatorError } from './ValidatorError';

export interface NumberOptions<T = false> extends ValidatorOptions<T> {
  min?: number;
  minInclusive?: boolean;
  max?: number;
  maxInclusive?: boolean;
  onlyInteger?: boolean;
  precision?: number;
}

const precisionPattern = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;

export abstract class BaseNumberValidator<T = number> extends Validator<T> {
  protected declare config: NumberOptions<T>;

  public min(min: number, inclusive: boolean = true): this {
    this.config.min = min;
    this.config.minInclusive = inclusive;
    return this;
  }

  public max(max: number, inclusive: boolean = true): this {
    this.config.max = max;
    this.config.maxInclusive = inclusive;
    return this;
  }

  protected validateValue(
    num: number,
    key: string,
    superKeys: string[],
  ): number {
    const {
      min = -Infinity,
      max = Infinity,
      minInclusive,
      maxInclusive,
      onlyInteger,
      precision,
    } = this.config;

    if (typeof num !== 'number' && typeof num === 'string') {
      num = Number(num);
    }

    if (!Number.isFinite(num)) {
      throw new ValidatorError('{{label}} must be number', key, superKeys);
    }

    if (onlyInteger && !Number.isInteger(num)) {
      throw new ValidatorError('{{label}} must be integer', key, superKeys);
    }

    if (
      (minInclusive ? num < min : num <= min) ||
      (maxInclusive ? num > max : num >= max)
    ) {
      throw new ValidatorError(
        '{{label}} is too small or too large',
        key,
        superKeys,
      );
    }

    if (precision !== undefined && !onlyInteger) {
      const matches = num.toString().match(precisionPattern)!;
      const decimals =
        (matches[1] ? matches[1].length : 0) -
        (matches[2] ? Number(matches[2]) : 0);

      if (decimals >= 0 && decimals > precision) {
        throw new ValidatorError(
          '{{label}} has incorrect decimals',
          key,
          superKeys,
        );
      }
    }

    return num;
  }
}
