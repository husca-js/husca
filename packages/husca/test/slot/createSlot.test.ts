import { expectType, TypeEqual } from 'ts-expect';
import { expect, test } from 'vitest';
import { ConsoleSlot, createSlot, MixedSlot, WebSlot } from '../../src';

test('create slot', () => {
  expect(createSlot('web', () => {})).toBeInstanceOf(WebSlot);
  expect(createSlot('console', () => {})).toBeInstanceOf(ConsoleSlot);
  expect(createSlot('mixed', () => {})).toBeInstanceOf(MixedSlot);
});

test('generate unique ID', () => {
  const slot = createSlot('web', () => {});
  const id = slot.createID();
  expect(slot.createID()).toBe(id);
  expect(slot.validate(id)).toBeTruthy();
  expect(slot.validate('xyz')).toBeFalsy();

  const slot2 = createSlot('web', () => {});
  expect(slot2.createID()).not.toBe(id);
});

test('generic', () => {});

test('type checking', () => {
  createSlot('web', (ctx, next) => {
    ctx.request.method;
    ctx.response.getHeaders();
    next();
  });
  createSlot('console', (ctx, next) => {
    ctx.request.argv;
    ctx.response.commandMatched;
    next();
  });
  createSlot('mixed', (ctx, next) => {
    ctx.request;
    ctx.response;
    next();

    // @ts-expect-error
    ctx.request.method;
    // @ts-expect-error
    ctx.request.argv;
    // @ts-expect-error
    ctx.response.getHeaders();
    // @ts-expect-error
    ctx.response.commandMatched;
  });

  // @ts-expect-error
  createSlot();
  // @ts-expect-error
  createSlot(() => {});
  // @ts-expect-error
  createSlot('', () => {});

  const slotWithGeneric = createSlot<{ test: number; test1: string }>(
    'web',
    (ctx) => {
      ctx.test.toFixed();
      ctx.test1 = 'abc';
      // @ts-expect-error
      ctx.test2;
    },
  );
  expectType<
    TypeEqual<WebSlot<{ test: number; test1: string }>, typeof slotWithGeneric>
  >(true);
  expectType<
    TypeEqual<
      MixedSlot<{ test: number; test1: string }>,
      typeof slotWithGeneric
    >
  >(false);
  expectType<
    TypeEqual<
      ConsoleSlot<{ test: number; test1: string }>,
      typeof slotWithGeneric
    >
  >(false);
});
