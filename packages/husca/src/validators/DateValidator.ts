import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

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

dayjs.extend(customParseFormat);

interface DateOptions<T> extends ValidatorOptions<T> {
  format?: string;
  min?: Date | (() => Date);
  minInclusive?: boolean;
  max?: Date | (() => Date);
  maxInclusive?: boolean;
  timezone?: string;
}

export class DateValidator<T = Date> extends Validator<T> {
  protected declare config: DateOptions<T>;

  constructor(format?: string) {
    super();
    this.config.format = format;
  }

  public declare optional: () => DateValidator<T | TOptional>;

  public declare default: (
    Date: ParameterOrFn<Date>,
  ) => DateValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public min(date: Date | (() => Date), inclusive: boolean = true): this {
    this.config.min = date;
    this.config.minInclusive = inclusive;
    return this;
  }

  public max(date: Date | (() => Date), inclusive: boolean = true): this {
    this.config.max = date;
    this.config.maxInclusive = inclusive;
    return this;
  }

  protected getCompareTimestamp(date: ParameterOrFn<Date>): number {
    return typeof date === 'function' ? date().getTime() : date.getTime();
  }

  protected validateValue(date: any, key: string, superKeys: string[]): Date {
    const {
      format = false,
      min,
      max,
      minInclusive,
      maxInclusive,
    } = this.config;
    const isTimestamp = format === false;

    if (
      typeof date !== (isTimestamp ? 'number' : 'string') &&
      !(date instanceof Date)
    ) {
      throw new ValidatorError(`{{label}} must be date`, key, superKeys);
    }

    let instance =
      isTimestamp || date instanceof Date
        ? dayjs(date)
        : dayjs(date, format, true);

    if (!instance.isValid()) {
      throw new ValidatorError(`{{label}} is invalid date`, key, superKeys);
    }

    const timestamp = instance.valueOf();
    if (
      (min &&
        (minInclusive
          ? timestamp < this.getCompareTimestamp(min)
          : timestamp <= this.getCompareTimestamp(min))) ||
      (max &&
        (maxInclusive
          ? timestamp > this.getCompareTimestamp(max)
          : timestamp >= this.getCompareTimestamp(max)))
    ) {
      throw new ValidatorError(
        `{{label}} is too early or too late`,
        key,
        superKeys,
      );
    }

    return instance.toDate();
  }
}
