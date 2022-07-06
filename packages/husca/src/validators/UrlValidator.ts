import { URL } from 'url';
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

interface UrlOptions<T> extends ValidatorOptions<T> {
  schemes: string[];
  autoComplete?: string;
}

const pattern = /[a-z]:\/\//i;

export class UrlValidator<T = string> extends Validator<T> {
  protected declare config: UrlOptions<T>;

  constructor() {
    super();
    this.config.schemes = ['http', 'https'];
  }

  public declare optional: () => UrlValidator<T | TOptional>;

  public declare default: (
    string: ParameterOrFn<T>,
  ) => UrlValidator<T | TDefault>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public schemes(schemes: string[]): this {
    this.config.schemes = schemes.map((scheme) => scheme.toLowerCase());
    return this;
  }

  public autoComplete(scheme: string): this {
    this.config.autoComplete = scheme;
    return this;
  }

  protected validateValue(url: any, key: string, superKeys: string[]): string {
    const { schemes, autoComplete } = this.config;

    if (typeof url !== 'string') {
      throw new ValidatorError('{{label}} must be string', key, superKeys);
    }

    if (autoComplete && !pattern.test(url)) {
      url = `${autoComplete}://${url}`;
    }

    const parsed = this.getURL(url);

    if (!parsed) {
      throw new ValidatorError('{{label}} must be url', key, superKeys);
    }

    if (!schemes.includes(parsed.protocol.replace(/:$/, ''))) {
      throw new ValidatorError(
        '{{label}} starts with invalid scheme',
        key,
        superKeys,
      );
    }

    return url;
  }

  protected getURL(url: string) {
    try {
      return new URL(url);
    } catch {
      return false;
    }
  }
}
