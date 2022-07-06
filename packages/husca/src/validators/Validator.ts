import { ValidatorError } from './ValidatorError';

export interface ValidatorOptions<Type> {
  defaultValue?: Type | (() => Type);
  required: boolean;
  transform?: (value: any) => Promise<any> | any;
}

export type TDefault = { _DEF_: '__default_value__'; __UNIQUE__: never };
export type TOptional = { _OPT_: '__optional_value__'; __UNIQUE__: never };
export type TObject = { _OBJ_: '__object_value__'; __UNIQUE__: never };

export type ConvertOptional<T> = TDefault extends T
  ? ConvertOptionalToNever<T>
  : ConvertOptionalToUndefined<T>;
export type ConvertOptionalToUndefined<T> = T extends TOptional
  ? undefined
  : T extends TDefault
  ? never
  : T extends TObject
  ? object
  : T;
export type ConvertOptionalToNever<T> = T extends TOptional | TDefault
  ? never
  : T extends TObject
  ? object
  : T;

export interface TransformedValidator<T> extends Validator<T> {}

export type GetValidatorType<T> = T extends Validator<infer Type>
  ? ConvertOptional<Type>
  : never;

export interface ValidatorTransformFn<T, T1> {
  (string: ConvertOptional<T>): Promise<T1> | T1;
}

export type ParameterOrFn<T> =
  | ConvertOptionalToNever<T>
  | (() => ConvertOptionalToNever<T>);

export abstract class Validator<T = unknown> {
  protected readonly config: ValidatorOptions<T> = {
    required: true,
  };

  public static validate(
    validator: Validator,
    data: Record<string, any>,
    key: string,
    superKeys: string[] = [],
  ): Promise<any> {
    return validator.validate(data, key, superKeys);
  }

  public static isEmpty(validator: Validator, value: any): boolean {
    return validator.isEmpty(value);
  }

  protected optional(): Validator {
    this.config.required = false;
    return this;
  }

  protected transform<T1>(fn: (value: any) => Promise<T1> | T1): Validator {
    this.config.transform = fn;
    return this;
  }

  protected default(value: any): Validator {
    this.optional();
    this.config.defaultValue = value;
    return this;
  }

  protected validate(
    data: Record<string, any>,
    key: string,
    superKeys: string[],
  ): Promise<any> {
    return this.validateFromValue(data[key], key, superKeys);
  }

  protected async validateFromValue(
    value: any,
    key: string,
    superKeys: string[],
  ): Promise<any> {
    const { defaultValue, required } = this.config;

    if (this.isEmpty(value)) {
      value = this.getDefaultValue(
        typeof defaultValue === 'function'
          ? (defaultValue as Function)()
          : defaultValue,
      );

      if (this.isEmpty(value)) {
        if (!required) return value;
        throw new ValidatorError('{{label}} is required', key, superKeys);
      }
    }

    value = await this.validateValue(value, key, superKeys);
    return this.config.transform ? this.config.transform(value) : value;
  }

  protected isEmpty(value: any): boolean {
    return value == null || value === '';
  }

  protected getDefaultValue(value?: T) {
    return value;
  }

  protected abstract validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): Promise<any> | any;
}
