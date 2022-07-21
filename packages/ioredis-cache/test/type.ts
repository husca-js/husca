import Redis from 'ioredis';
import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { RedisCache } from '../src';

const cache = new RedisCache({
  redis: new Redis(),
});

describe('set', () => {
  const result = cache.set('x', 'y');
  expectType<TypeEqual<boolean, Awaited<typeof result>>>(true);
});

describe('get', () => {
  const get1 = cache.get('x');
  expectType<
    TypeEqual<string | number | object | boolean | null, Awaited<typeof get1>>
  >(true);

  const get2 = cache.get('x', 20);
  expectType<TypeEqual<number, Awaited<typeof get2>>>(true);

  const get3 = cache.get('x', 'y');
  expectType<TypeEqual<string, Awaited<typeof get3>>>(true);

  const get4 = cache.get<string>('x');
  expectType<TypeEqual<string | null, Awaited<typeof get4>>>(true);
});

describe('add', () => {
  const result = cache.add('x', 'y');
  expectType<TypeEqual<boolean, Awaited<typeof result>>>(true);
});

describe('exists', () => {
  const result = cache.exists('x');
  expectType<TypeEqual<boolean, Awaited<typeof result>>>(true);
});

describe('getOrSet', () => {
  const result = cache.getOrSet('x', () => 20);
  expectType<TypeEqual<20, Awaited<typeof result>>>(true);
});

describe('delete', () => {
  const result = cache.delete('x');
  expectType<TypeEqual<boolean, Awaited<typeof result>>>(true);
});

describe('invalid usage', () => {
  cache.get<number>('x', 20);
  cache.getOrSet<number>('x', () => 20);

  // @ts-expect-error
  cache.get<string>('x', 20);
  // @ts-expect-error
  cache.get<number>('x', true);
  // @ts-expect-error
  cache.getOrSet<number>('x', () => '20');
});
