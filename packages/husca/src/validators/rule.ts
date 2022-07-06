import { NumberValidator } from './NumberValidator';
import { IntValidator } from './IntValidator';
import { StringValidator } from './StringValidator';
import { EnumValidator } from './EnumValidator';
import { UrlValidator } from './UrlValidator';
import { UuidValidator, UuidVersion } from './UuidValidator';
import { IpValidator, IpVersion } from './IpValidator';
import { EmailValidator } from './EmailValidator';
import { BooleanValidator } from './BoolenValidator';
import { ArrayValidator } from './ArrayValidator';
import { ObjectValidator } from './ObjectValidator';
import { FileValidator } from './FileValidator';
import { OneOfValidator } from './OneOfValidator';
import { GetValidatorType, TObject, Validator } from './Validator';
import { toArray } from '../utils/toArray';
import { DateValidator } from './DateValidator';

export class ValidatorStatic {
  number() {
    return new NumberValidator();
  }

  int() {
    return new IntValidator();
  }

  enum<T extends string | number | boolean>(ranges: [T]): EnumValidator<T>;
  enum<
    T extends string | number | boolean,
    T1 extends string | number | boolean,
  >(ranges: [T, ...T1[]]): EnumValidator<T | T1>;
  enum<
    T extends string | number | boolean,
    T1 extends string | number | boolean,
  >(ranges: [T, ...T1[]]) {
    return new EnumValidator<T | T1>(ranges);
  }

  string() {
    return new StringValidator();
  }

  url() {
    return new UrlValidator();
  }

  array<T extends Validator | undefined>(
    item?: T,
  ): ArrayValidator<
    keyof T extends undefined ? unknown[] : GetValidatorType<T>[]
  >;
  array<T extends { [key: string]: P }, P extends Validator>(
    ruleObject: T,
  ): ArrayValidator<{ [K in keyof T]: GetValidatorType<T[K]> }[]>;
  array(values?: Validator | { [key: string]: Validator }) {
    return new ArrayValidator<any>(
      !values || values instanceof Validator ? values : this.object(values),
    );
  }

  object<T extends { [key: string]: Validator } | undefined>(
    properties?: T,
  ): ObjectValidator<
    keyof T extends undefined
      ? TObject
      : { [K in keyof T]: GetValidatorType<T[K]> }
  > {
    return new ObjectValidator(properties);
  }

  boolean() {
    return new BooleanValidator();
  }

  file() {
    return new FileValidator();
  }

  email() {
    return new EmailValidator();
  }

  uuid(version: UuidVersion): UuidValidator<string>;
  uuid(versions: [UuidVersion, ...UuidVersion[]]): UuidValidator<string>;
  uuid(versions: UuidVersion | [UuidVersion, ...UuidVersion[]]) {
    return new UuidValidator(toArray(versions));
  }

  ip(version: IpVersion | [IpVersion, ...IpVersion[]]) {
    return new IpValidator(toArray(version));
  }

  oneOf<T extends Validator[], A extends Validator, B extends Validator>(
    rules: [rule1: A, rule2: B, ...others: T],
  ): OneOfValidator<
    | GetValidatorType<A>
    | GetValidatorType<B>
    | { [K in keyof T]: GetValidatorType<T[K]> }[number]
  >;
  oneOf<T extends Validator[], A extends Validator, B extends Validator>(
    rule1: A,
    rule2: B,
    ...others: T
  ): OneOfValidator<
    | GetValidatorType<A>
    | GetValidatorType<B>
    | { [K in keyof T]: GetValidatorType<T[K]> }[number]
  >;
  oneOf(...args: any[]) {
    return new OneOfValidator<any>(
      args.reduce((carry, item) => carry.concat(item), [] as any[]),
    );
  }

  /**
   *
   * @link https://day.js.org/docs/zh-CN/parse/string-format#支持的解析占位符列表
   */
  datetime(format: string) {
    return new DateValidator(format);
  }

  timestamp() {
    return new DateValidator();
  }
}

export const rule = new ValidatorStatic();
