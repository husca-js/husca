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

const versions = <const>['v1', 'v2', 'v3', 'v4', 'v5'];
export type UuidVersion = typeof versions[number];

export interface UuidOptions<T = string> extends ValidatorOptions<T> {
  uuidVersion: UuidVersion[];
}

const patterns: {
  [key in UuidVersion | 'all']: RegExp;
} = {
  v1: /^[0-9A-F]{8}-[0-9A-F]{4}-1[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v2: /^[0-9A-F]{8}-[0-9A-F]{4}-2[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  v5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
};

export class UuidValidator<T = string> extends Validator<T> {
  protected declare config: UuidOptions<T>;

  constructor(versions: UuidVersion[]) {
    super();
    this.config.uuidVersion = versions;
  }

  public declare optional: () => UuidValidator<T | TOptional>;

  public declare default: (
    uuid: ParameterOrFn<T>,
  ) => UuidValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  protected validateValue(uuid: any, key: string, superKeys: string[]): void {
    const { uuidVersion } = this.config;

    let valid = false;

    if (typeof uuid !== 'string') {
      valid = false;
    } else if (uuidVersion.length === versions.length) {
      valid = patterns.all.test(uuid);
    } else {
      for (let i = uuidVersion.length; i-- > 0; ) {
        if (patterns[uuidVersion[i]!].test(uuid)) {
          valid = true;
          break;
        }
      }
    }

    if (!valid) {
      throw new ValidatorError(
        `{{label}} must be uuid with versions: ${uuidVersion.join(' or ')}`,
        key,
        superKeys,
      );
    }

    return uuid;
  }
}
