import { RedisClientType } from 'redis';
import { BaseCache, type BaseCacheOptions } from '@husca/husca';

export interface RedisCacheOptions extends BaseCacheOptions {
  redis: RedisClientType;
}

export class RedisCache extends BaseCache {
  private readonly redis: RedisClientType;

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
    const result: string | null = await this.redis.set(key, value, {
      PX: duration,
    });
    return result !== null;
  }

  protected override async addValue(
    key: string,
    value: string,
    duration?: number | undefined,
  ): Promise<boolean> {
    const result: string | null = await this.redis.set(key, value, {
      PX: duration,
      NX: true,
    });
    return result !== null;
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
    const pattern = `${this.keyPrefix}*`;
    const keys = await redis.keys(pattern);
    await redis.del(keys);
    return true;
  }
}
