import { Redis } from 'ioredis';
import { BaseCache, type BaseCacheOptions } from '@husca/husca';

export interface RedisCacheOptions extends BaseCacheOptions {
  redis: Redis;
}

export class RedisCache extends BaseCache {
  private readonly redis: Redis;

  constructor(config: RedisCacheOptions) {
    super(config);
    this.redis = config.redis;
  }

  protected getValue(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  protected async setValue(
    key: string,
    value: string,
    duration?: number | undefined,
  ): Promise<boolean> {
    let result: 'OK';
    if (duration !== undefined) {
      result = await this.redis.set(key, value, 'PX', duration);
    } else {
      result = await this.redis.set(key, value);
    }
    return result === 'OK';
  }

  protected override async addValue(
    key: string,
    value: string,
    duration?: number | undefined,
  ): Promise<boolean> {
    let result: 'OK' | null;
    if (duration !== undefined) {
      result = await this.redis.set(key, value, 'PX', duration, 'NX');
    } else {
      result = await this.redis.set(key, value, 'NX');
    }
    return result === 'OK';
  }

  protected async existsKey(key: string): Promise<boolean> {
    const count: number = await this.redis.exists(key);
    return count === 1;
  }

  protected async deleteValue(key: string): Promise<boolean> {
    await this.redis.del(key);
    return true;
  }

  protected async deleteAllValues(): Promise<boolean> {
    const { redis } = this;
    const pattern = `${redis.options.keyPrefix ?? ''}${this.keyPrefix}*`;
    const keys = await redis.keys(pattern);
    await redis.del(keys);
    return true;
  }
}
