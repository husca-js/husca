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

interface ArrayOptions<T> extends ValidatorOptions<T> {
  itemValidator?: Validator;
  lengthRange: { min?: number; max?: number };
}

export class ArrayValidator<T = unknown[]> extends Validator<T> {
  protected declare config: ArrayOptions<T>;

  constructor(validator?: Validator) {
    super();
    this.config.itemValidator = validator;
    this.config.lengthRange = {};
  }

  public declare optional: () => ArrayValidator<T | TOptional>;

  public declare default: (
    array: ParameterOrFn<T>,
  ) => ArrayValidator<T | TDefault>;

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

  protected async validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): Promise<any[]> {
    const {
      lengthRange: { min = 0, max = Infinity },
      itemValidator,
    } = this.config;
    if (!Array.isArray(value)) {
      throw new ValidatorError('{{label}} must be array', key, superKeys);
    }

    const items = value.slice();
    const length = items.length;

    if (length < min || length > max) {
      throw new ValidatorError(
        `{{label}} has too many or too few items`,
        key,
        superKeys,
      );
    }

    if (itemValidator) {
      const newSuperKeys = superKeys.concat(key);

      await Promise.all(
        items.map(async (_, index, arr) => {
          arr[index] = await Validator.validate(
            itemValidator,
            arr,
            index.toString(),
            newSuperKeys,
          );
        }),
      );
    }

    return items;
  }
}
