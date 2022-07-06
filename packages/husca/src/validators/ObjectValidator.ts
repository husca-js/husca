import {
  TDefault,
  TObject,
  TOptional,
  TransformedValidator,
  Validator,
  ParameterOrFn,
  ValidatorOptions,
  ValidatorTransformFn,
} from './Validator';
import { ValidatorError } from './ValidatorError';

type ObjectProperty = Record<string, Validator>;

interface ObjectOptions<T> extends ValidatorOptions<T> {
  properties?: ObjectProperty;
  stringToObject?: boolean;
}

export class ObjectValidator<T = TObject> extends Validator<T> {
  protected declare config: ObjectOptions<T>;

  constructor(properties?: ObjectProperty) {
    super();
    this.config.properties = properties;
  }

  public declare optional: () => ObjectValidator<T | TOptional>;

  public declare default: (
    object: ParameterOrFn<T>,
  ) => ObjectValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public allowFromString(is: boolean = true): this {
    this.config.stringToObject = is;
    return this;
  }

  protected isPlainObject(value: any): value is object {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  protected async validateValue(
    origin: Record<string, any>,
    key: string,
    superKeys: string[],
  ): Promise<object> {
    const { properties, stringToObject = false } = this.config;

    if (!this.isPlainObject(origin)) {
      let valid = false;
      if (stringToObject && typeof origin === 'string') {
        try {
          origin = JSON.parse(origin);
          valid = this.isPlainObject(origin);
        } catch {}
      }

      if (!valid) {
        throw new ValidatorError('{{label}} must be object', key, superKeys);
      }
    }

    let obj: Record<string, any> = {};

    if (properties) {
      const newSuperKeys = superKeys.concat(key);

      await Promise.all(
        Object.entries(properties).map(async ([propKey, validator]) => {
          obj[propKey] = await Validator.validate(
            validator,
            origin,
            propKey,
            newSuperKeys,
          );
        }),
      );
    } else {
      Object.assign(obj, origin);
    }

    return obj;
  }
}
