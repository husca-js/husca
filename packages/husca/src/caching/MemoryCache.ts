import LRU from 'lru-cache';
import { BaseCache, BaseCacheOptions } from './BaseCache';

export interface MemoryCacheOptions extends BaseCacheOptions {
  /**
   * The maximum size of the cache. Default to `Infinity`
   */
  maxItems?: number;
  maxSize?: number;
}

export class MemoryCache extends BaseCache {
  private readonly cache: LRU<string, string>;

  constructor(options: MemoryCacheOptions = {}) {
    super(options);
    this.cache = new LRU<string, string>({
      max: Math.min(Math.pow(2, 32) - 1, options.maxItems ?? 1000),
      maxSize: options.maxSize,
    });
  }

  protected override async existsKey(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  protected async getValue(key: string): Promise<string | null> {
    const data = this.cache.get(key);
    return data === undefined ? null : data;
  }

  protected async setValue(
    key: string,
    value: string,
    duration?: number,
  ): Promise<boolean> {
    this.cache.set(key, value, {
      ttl: duration,
    });
    return true;
  }

  protected async deleteValue(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  protected async deleteAllValues(): Promise<boolean> {
    this.cache.clear();
    return true;
  }
}
