import { createHash } from 'crypto';
import { createSlot, MixedSlot } from '../slot';

export interface BaseCacheOptions {
  keyPrefix?: string;
}

export abstract class BaseCache {
  protected readonly keyPrefix: string;

  constructor(config: BaseCacheOptions) {
    this.keyPrefix = config.keyPrefix ?? '';
  }

  async exists(key: string): Promise<boolean> {
    return this.existsKey(this.buildKey(key));
  }

  async get<T>(key: string, defaultValue: T): Promise<T>;
  async get<T extends string | number | object | boolean>(
    key: string,
  ): Promise<T | null>;
  async get(
    key: string,
    defaultValue?: string | number | object | boolean,
  ): Promise<any> {
    const hashKey = this.buildKey(key);
    let result = await this.getValue(hashKey);

    if (result === null) {
      return defaultValue === undefined ? null : defaultValue;
    }

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  // Notice: Overloading of functions to against the complex object such as `sequelize Model`
  async getOrSet<T extends string | number | object | boolean>(
    key: string,
    orSet: () => T,
    duration?: number,
  ): Promise<T>;
  async getOrSet<T extends string | number | object | boolean>(
    key: string,
    orSet: () => Promise<T>,
    duration?: number,
  ): Promise<T>;
  async getOrSet<T extends string | number | object | boolean>(
    key: string,
    orSet: () => T | Promise<T>,
    duration?: number,
  ): Promise<T> {
    let value: T | null = await this.get(key);

    if (value !== null) return value;

    value = await orSet();
    await this.set(key, value, duration);
    return value;
  }

  async set(
    key: string,
    value: string | number | object | boolean,
    duration?: number,
  ): Promise<boolean> {
    const hashKey = this.buildKey(key);
    const wrappedValue = JSON.stringify(value);
    return this.setValue(hashKey, wrappedValue, duration);
  }

  async add(key: string, value: any, duration?: number): Promise<boolean> {
    const hashKey = this.buildKey(key);
    const wrappedValue = JSON.stringify(value);
    return this.addValue(hashKey, wrappedValue, duration);
  }

  async delete(key: string): Promise<boolean> {
    const hashKey = this.buildKey(key);
    return this.deleteValue(hashKey);
  }

  async deleteAll(): Promise<boolean> {
    return this.deleteAllValues();
  }

  public toSlot(): MixedSlot<{ readonly cache: BaseCache }> {
    return createSlot('mixed', (ctx, next) => {
      ctx.cache = this;
      return next();
    });
  }

  protected buildKey(key: string): string {
    const hashKey =
      key.length <= 32 ? key : createHash('md5').update(key).digest('hex');

    return this.keyPrefix + hashKey;
  }

  protected async addValue(
    key: string,
    value: string,
    duration?: number,
  ): Promise<boolean> {
    return (await this.existsKey(key))
      ? false
      : this.setValue(key, value, duration);
  }

  protected async existsKey(key: string): Promise<boolean> {
    return (await this.getValue(key)) !== null;
  }

  protected abstract getValue(key: string): Promise<string | null>;
  protected abstract setValue(
    key: string,
    value: string,
    duration?: number,
  ): Promise<boolean>;
  protected abstract deleteValue(key: string): Promise<boolean>;
  protected abstract deleteAllValues(): Promise<boolean>;
}
