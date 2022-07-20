import { tmpdir } from 'os';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import sleep from 'sleep-promise';
import { FileCache } from '../../src/caching/FileCache';
import { rm } from 'fs/promises';
import path, { join } from 'path';
import { BaseCache, composeToMiddleware, MixedSlot } from '../../src';
import { createHash } from 'crypto';
import { glob } from 'glob';
import { promisify } from 'util';

describe('common', () => {
  let cache: FileCache;
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = join(tmpdir(), 'cache-' + Date.now());
    cache = new FileCache({
      cacheDir: cacheDir,
    });
  });

  afterEach(async () => {
    try {
      await rm(cacheDir, { recursive: true });
    } catch {}
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
  let cache: FileCache;

  afterEach(async () => {
    await cache.deleteAll();
  });

  test('fail to set key without dir X permission', async () => {
    cache = new FileCache({
      dirMode: 0o666,
    });

    await expect(cache.set('key', 'value')).rejects.toThrowError();
  });

  test('never throw even cacheDir was deleted', async () => {
    const cacheDir = path.resolve(tmpdir(), 'a', 'b', 'c');
    cache = new FileCache({
      cacheDir: cacheDir,
    });

    await rm(cacheDir, { recursive: true });
    await expect(cache.deleteAll()).resolves.toBeTruthy();
  });

  test('gc always', async () => {
    const cacheDir = path.resolve(tmpdir(), 'a', 'b', 'c');
    const pattern = path.join(cacheDir, '**/*');
    cache = new FileCache({
      cacheDir,
      gcProbability: 100,
    });
    await cache.set('key a', 'value');
    await cache.set('key b', 'value', 10);
    await expect(
      promisify(glob)(pattern, { nodir: true }),
    ).resolves.toHaveLength(2);
    await sleep(12);
    await cache.set('key a', 'value');
    await expect(
      promisify(glob)(pattern, { nodir: true }),
    ).resolves.toHaveLength(1);
  });

  test('gc never', async () => {
    const cacheDir = path.resolve(tmpdir(), 'a', 'b', 'c');
    const pattern = path.join(cacheDir, '**/*');
    cache = new FileCache({
      cacheDir,
      gcProbability: 0,
    });
    await cache.set('key a', 'value');
    await cache.set('key b', 'value', 10);
    await sleep(12);
    for (let i = 0; i < 20; ++i) {
      await cache.set('key a', 'value');
    }
    await expect(
      promisify(glob)(pattern, { nodir: true }),
    ).resolves.toHaveLength(2);
  });
});
