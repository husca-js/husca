import LRU from 'lru-cache';
import { BaseCache, BaseCacheOptions } from './BaseCache';

export interface MemoryCacheOptions extends BaseCacheOptions {
  /**
   * The maximum size of the cache. Default to `Infinity`
   */
  maxItems?: number;
  maxSize?: number;
  gcProbability?: number;
}

export class MemoryCache extends BaseCache {
  private readonly lru: LRU<string, string>;
  protected readonly gcProbability: number;

  constructor(options: MemoryCacheOptions = {}) {
    super(options);
    this.gcProbability = (options.gcProbability ?? 10) / 100;
    this.lru = new LRU<string, string>({
      max: Math.min(Math.pow(2, 32) - 1, options.maxItems ?? 1000),
      maxSize: options.maxSize,
    });
  }

  protected override async existsKey(key: string): Promise<boolean> {
    return this.lru.has(key);
  }

  protected async getValue(key: string): Promise<string | null> {
    const data = this.lru.get(key);
    return data === undefined ? null : data;
  }

  protected async setValue(
    key: string,
    value: string,
    duration?: number,
  ): Promise<boolean> {
    this.gc();
    this.lru.set(key, value, {
      ttl: duration,
    });
    return true;
  }

  protected async deleteValue(key: string): Promise<boolean> {
    return this.lru.delete(key);
  }

  protected async deleteAllValues(): Promise<boolean> {
    this.lru.clear();
    return true;
  }

  protected gc() {
    if (Math.random() > this.gcProbability) return;
    this.lru.purgeStale();
  }
}
