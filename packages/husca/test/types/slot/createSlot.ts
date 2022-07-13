import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import {
  createSlot,
  WebCtx,
  Next,
  ConsoleCtx,
  WebSlot,
  ConsoleSlot,
  MixedSlot,
} from '../../../src';
import { noop } from '../../helpers/noop';

describe('slot instance', () => {
  expectType<WebSlot>(createSlot(noop));
  expectType<WebSlot>(createSlot(noop, 'web'));
  expectType<ConsoleSlot>(createSlot(noop, 'console'));
  expectType<MixedSlot>(createSlot(noop, 'mixed'));
});

describe('slot context and next', () => {
  createSlot((ctx, next) => {
    expectType<WebCtx>(ctx);
    expectType<Next>(next);
  });

  createSlot((ctx, next) => {
    expectType<ConsoleCtx>(ctx);
    expectType<Next>(next);
  }, 'console');

  createSlot((ctx, next) => {
    expectType<TypeEqual<WebCtx, typeof ctx>>(false);
    expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
    expectType<TypeEqual<WebCtx | ConsoleCtx, typeof ctx>>(true);
    expectType<Next>(next);
  }, 'mixed');
});

describe('web slot with generic', () => {
  const slot = createSlot<{ readonly test: number; test1: string }>((ctx) => {
    expectType<TypeEqual<WebCtx<{ test: number; test1: string }>, typeof ctx>>(
      true,
    );
  });
  expectType<TypeEqual<WebSlot<{ test: number; test1: string }>, typeof slot>>(
    false,
  );
  expectType<
    TypeEqual<WebSlot<{ readonly test: number; test1: string }>, typeof slot>
  >(true);
});

describe('console slot with generic', () => {
  const slot = createSlot<{ readonly test: number; test1: string }>((ctx) => {
    expectType<
      TypeEqual<ConsoleCtx<{ test: number; test1: string }>, typeof ctx>
    >(true);
  }, 'console');
  expectType<
    TypeEqual<ConsoleSlot<{ test: number; test1: string }>, typeof slot>
  >(false);
  expectType<
    TypeEqual<
      ConsoleSlot<{ readonly test: number; test1: string }>,
      typeof slot
    >
  >(true);
});

describe('mixed slot with generic', () => {
  const slot = createSlot<{ readonly test: number; test1: string }>((ctx) => {
    expectType<
      TypeEqual<
        | ConsoleCtx<{ test: number; test1: string }>
        | WebCtx<{ test: number; test1: string }>,
        typeof ctx
      >
    >(true);
  }, 'mixed');
  expectType<
    TypeEqual<MixedSlot<{ test: number; test1: string }>, typeof slot>
  >(false);
  expectType<
    TypeEqual<MixedSlot<{ readonly test: number; test1: string }>, typeof slot>
  >(true);
});

describe('invalid usage', () => {
  createSlot(noop);
  // @ts-expect-error
  createSlot();
  // @ts-expect-error
  createSlot('web');
  // @ts-expect-error
  createSlot(noop, '');
  // @ts-expect-error
  createSlot(noop, 'web1');
  // @ts-expect-error
  createSlot('', noop);
});
