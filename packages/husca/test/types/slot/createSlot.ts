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
  expectType<WebSlot>(createSlot('web', noop));
  expectType<ConsoleSlot>(createSlot('console', noop));
  expectType<MixedSlot>(createSlot('mixed', noop));
});

describe('slot context and next', () => {
  createSlot((ctx, next) => {
    expectType<WebCtx>(ctx);
    expectType<Next>(next);
  });

  createSlot('console', (ctx, next) => {
    expectType<ConsoleCtx>(ctx);
    expectType<Next>(next);
  });

  createSlot('mixed', (ctx, next) => {
    expectType<TypeEqual<WebCtx, typeof ctx>>(false);
    expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
    expectType<TypeEqual<WebCtx | ConsoleCtx, typeof ctx>>(true);
    expectType<Next>(next);
  });
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
  const slot = createSlot<{ readonly test: number; test1: string }>(
    'console',
    (ctx) => {
      expectType<
        TypeEqual<ConsoleCtx<{ test: number; test1: string }>, typeof ctx>
      >(true);
    },
  );
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
  const slot = createSlot<{ readonly test: number; test1: string }>(
    'mixed',
    (ctx) => {
      expectType<
        TypeEqual<
          | ConsoleCtx<{ test: number; test1: string }>
          | WebCtx<{ test: number; test1: string }>,
          typeof ctx
        >
      >(true);
    },
  );
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
  createSlot('', noop);
  // @ts-expect-error
  createSlot('web1', noop);
  // @ts-expect-error
  createSlot(noop, 'web');
  // @ts-expect-error
  createSlot('', noop);
});
