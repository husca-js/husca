import { afterEach, describe, expect, test } from 'vitest';
import sleep from 'sleep-promise';
import {
  BaseCache,
  composeToMiddleware,
  MemoryCache,
  MixedSlot,
} from '../../src';
import { createHash } from 'crypto';

describe('common', () => {
  const cache: MemoryCache = new MemoryCache();

  afterEach(async () => {
    await cache.deleteAll();
  });

  test('set and get', async () => {
    await expect(cache.get('my-key')).resolves.toBeNull();
    await cache.set('my-key', 'my-value');
    await expect(cache.get('my-key')).resolves.toBe('my-value');
  });

  test('get with default value', async () => {
    await expect(cache.get('my-key', 'deafult')).resolves.toBe('deafult');
    await cache.set('my-key', 'my-value');
    await expect(cache.get('my-key')).resolves.toBe('my-value');
  });

  test('override previous value when set again', async () => {
    await cache.set('my-key', 'my-value');
    await expect(cache.get('my-key')).resolves.toBe('my-value');
    await cache.set('my-key', 'value-123');
    await expect(cache.get('my-key')).resolves.toBe('value-123');
  });

  test('add without overridding', async () => {
    await expect(cache.add('my-key', 'my-value')).resolves.toBeTruthy();
    await expect(cache.get('my-key')).resolves.toBe('my-value');
    await expect(cache.add('my-key', 'other-value')).resolves.toBeFalsy();
    await expect(cache.get('my-key')).resolves.toBe('my-value');
  });

  test('set with expire', async () => {
    await cache.set('my-key', 'test', 10);
    await expect(cache.get('my-key')).resolves.toBe('test');
    await sleep(12);
    await expect(cache.get('my-key')).resolves.toBeNull();
  });

  test('add with expire', async () => {
    await expect(cache.add('my-key', 'test', 10)).resolves.toBeTruthy();
    await expect(cache.get('my-key')).resolves.toBe('test');
    await sleep(12);
    await expect(cache.get('my-key')).resolves.toBeNull();
    await expect(cache.add('my-key', 'test-1', 10)).resolves.toBeTruthy();
    await expect(cache.get('my-key')).resolves.toBe('test-1');
  });

  test('getOrSet', async () => {
    await expect(cache.getOrSet('my-key', () => 'value')).resolves.toBe(
      'value',
    );
    await expect(cache.getOrSet('my-key', () => 'value-123')).resolves.toBe(
      'value',
    );
    await expect(cache.get('my-key')).resolves.toBe('value');
  });

  test('getOrSet with expire', async () => {
    await cache.getOrSet('my-key', () => 'test', 10);
    await expect(cache.get('my-key')).resolves.toBe('test');
    await sleep(12);
    await expect(cache.getOrSet('my-key', () => 'test2')).resolves.toBe(
      'test2',
    );
  });

  test('exists', async () => {
    await expect(cache.exists('my-key')).resolves.toBeFalsy();
    await cache.set('my-key', 'my-value');
    await expect(cache.exists('my-key')).resolves.toBeTruthy();
  });

  test('exists with expire', async () => {
    await expect(cache.exists('my-key')).resolves.toBeFalsy();
    await cache.set('my-key', 'my-value', 10);
    await expect(cache.exists('my-key')).resolves.toBeTruthy();
    await sleep(11);
    await expect(cache.exists('my-key')).resolves.toBeFalsy();
  });

  test('delete key', async () => {
    await cache.set('my-key', 'my-value');
    await expect(cache.get('my-key')).resolves.toBe('my-value');
    await cache.delete('my-key');
    await expect(cache.get('my-key')).resolves.toBeNull();
  });

  test('delete unrelated key', async () => {
    await cache.set('my-key', 'my-value');
    await cache.delete('other-key');
    await expect(cache.get('my-key')).resolves.toBe('my-value');
  });

  test('delete all', async () => {
    await cache.set('my-key', 'my-value');
    await cache.set('next-key', 'my-value');
    await cache.deleteAll();
    await expect(cache.get('my-key')).resolves.toBeNull();
    await expect(cache.get('next-key')).resolves.toBeNull();
  });

  test('delete empty keys', async () => {
    await expect(cache.deleteAll()).resolves.toBeTruthy();
  });

  test('convert key to md5', async () => {
    const key = '-'.repeat(33);
    await cache.set(key, 'value');
    await expect(
      cache.get(createHash('md5').update('x').digest('hex')),
    ).resolves.not.toBe('value');
    await expect(
      cache.get(createHash('md5').update(key).digest('hex')),
    ).resolves.toBe('value');
  });

  test('to mixed slot', async () => {
    expect(cache.toSlot()).toBeInstanceOf(MixedSlot);
    const ctx: Record<string, any> = {};
    await composeToMiddleware([cache.toSlot()])(ctx);
    expect(ctx['cache']).toBeInstanceOf(BaseCache);
  });
});

describe('special', () => {
  test('max item', async () => {
    const cache = new MemoryCache({
      maxItems: 3,
    });
    await cache.set('a1', 'b1');
    await cache.set('a2', 'b2');
    await cache.set('a3', 'b3');

    await expect(cache.get('a1')).resolves.toBe('b1');
    await expect(cache.get('a2')).resolves.toBe('b2');
    await expect(cache.get('a3')).resolves.toBe('b3');

    await cache.set('a4', 'b4');
    await expect(cache.get('a1')).resolves.toBeNull();
    await expect(cache.get('a2')).resolves.toBe('b2');
    await expect(cache.get('a3')).resolves.toBe('b3');
    await expect(cache.get('a4')).resolves.toBe('b4');
  });
});
