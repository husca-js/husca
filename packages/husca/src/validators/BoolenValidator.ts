import {
  TDefault,
  TOptional,
  TransformedValidator,
  Validator,
  ValidatorOptions,
  ValidatorTransformFn,
} from './Validator';
import { ValidatorError } from './ValidatorError';

interface BooleanOptions<T> extends ValidatorOptions<T> {
  trueValues?: any[];
  falseValues?: any[];
}

export class BooleanValidator<T = boolean> extends Validator<T> {
  protected declare config: BooleanOptions<T>;
  protected static trueValues: any[] = [1, '1', true, 'true'];
  protected static falseValues: any[] = [0, '0', false, 'false'];

  public declare optional: () => BooleanValidator<T | TOptional>;

  public declare default: (boolValue: any) => BooleanValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public trueValues(values: any[]): this {
    this.config.trueValues = values;
    return this;
  }

  public falseValues(values: any[]): this {
    this.config.falseValues = values;
    return this;
  }

  protected validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): boolean {
    const {
      trueValues = BooleanValidator.trueValues,
      falseValues = BooleanValidator.falseValues,
    } = this.config;

    if (trueValues.includes(value)) {
      return true;
    }

    if (falseValues.includes(value)) {
      return false;
    }

    throw new ValidatorError('{{label}} must be boolean', key, superKeys);
  }
}
