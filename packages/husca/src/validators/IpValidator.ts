import ipRegexp from 'ip-regex';
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

const versions = <const>['v4', 'v6'];

export type IpVersion = typeof versions[number];

interface IpOptions<T> extends ValidatorOptions<T> {
  ipVersion: IpVersion[];
}

const patterns: {
  [key in IpVersion | 'all']: RegExp;
} = {
  v4: ipRegexp.v4({ exact: true, includeBoundaries: true }),
  v6: ipRegexp.v6({ exact: true, includeBoundaries: true }),
  all: ipRegexp({ exact: true, includeBoundaries: true }),
};

export class IpValidator<T = string> extends Validator<T> {
  protected declare config: IpOptions<T>;

  constructor(version: IpVersion[]) {
    super();
    this.config.ipVersion = version;
  }

  public declare optional: () => IpValidator<T | TOptional>;

  public declare default: (ip: ParameterOrFn<T>) => IpValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  protected validateValue(ip: any, key: string, superKeys: string[]): void {
    const { ipVersion } = this.config;
    let valid = false;

    if (typeof ip !== 'string') {
      valid = false;
    } else if (ipVersion.length === versions.length) {
      valid = patterns.all.test(ip);
    } else {
      for (let i = ipVersion.length; i-- > 0; ) {
        if (patterns[ipVersion[i]!].test(ip)) {
          valid = true;
          break;
        }
      }
    }

    if (!valid) {
      throw new ValidatorError(
        `{{label}} must be IP with versions: ${ipVersion.join(' or ')}`,
        key,
        superKeys,
      );
    }

    return ip;
  }
}
