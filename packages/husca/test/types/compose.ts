import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import {
  MixedSlot,
  composeToMiddleware,
  composeToSlot,
  Middleware,
} from '../../src';

describe('middleware', () => {
  const middleware = composeToMiddleware([]);
  expectType<TypeEqual<Middleware, typeof middleware>>(true);
});

describe('slot', () => {
  const slot = composeToSlot([]);
  expectType<TypeEqual<MixedSlot, typeof slot>>(true);
});

describe('invalid usage', () => {
  const middleware = composeToMiddleware([]);
  middleware({}).then().catch();
  middleware({}, () => new Promise(() => {}));
  middleware({}, async () => {});

  // @ts-expect-error
  middleware();
  // @ts-expect-error
  middleware({}, () => {});
});
