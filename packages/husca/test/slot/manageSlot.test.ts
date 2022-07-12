import { expectType, TypeEqual } from 'ts-expect';
import { expect, test } from 'vitest';
import { createSlot, manageSlots } from '../../src';
import {
  SlotManager,
  WebSlotManager,
  ConsoleSlotManager,
  MixedSlotManager,
} from '../../src/slot';

test('instance', () => {
  expect(manageSlots()).toBeInstanceOf(WebSlotManager);
  expect(manageSlots('web')).toBeInstanceOf(WebSlotManager);
  expect(manageSlots('console')).toBeInstanceOf(ConsoleSlotManager);
  expect(manageSlots('mixed')).toBeInstanceOf(MixedSlotManager);
});

test('manage web slots', () => {
  const webSlot1 = createSlot<{ a: string }>(() => {});
  const webSlot2 = createSlot<{ b: number }>(() => {});
  const mixedSlot3 = createSlot<{ c: object }>(() => {}, 'mixed');

  const slots = manageSlots().load(webSlot1).load(webSlot2).load(mixedSlot3);

  expect(SlotManager.flatten(slots)).toHaveLength(3);
  expect(slots).toBeInstanceOf(WebSlotManager);
  expectType<
    TypeEqual<WebSlotManager<{ a: string; b: number; c: object }>, typeof slots>
  >(true);
  expectType<
    TypeEqual<
      ConsoleSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(false);
  expectType<
    TypeEqual<
      MixedSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(false);

  // @ts-expect-error
  slots.load(createSlot(() => {}, 'console'));
});

test('manage console slots', () => {
  const consoleSlot1 = createSlot<{ a: string }>(() => {}, 'console');
  const consoleSlot2 = createSlot<{ b: number }>(() => {}, 'console');
  const mixedSlot3 = createSlot<{ c: object }>(() => {}, 'mixed');

  const slots = manageSlots('console')
    .load(consoleSlot1)
    .load(consoleSlot2)
    .load(mixedSlot3);

  expect(SlotManager.flatten(slots)).toHaveLength(3);
  expect(slots).toBeInstanceOf(ConsoleSlotManager);
  expectType<
    TypeEqual<
      ConsoleSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(true);
  expectType<
    TypeEqual<WebSlotManager<{ a: string; b: number; c: object }>, typeof slots>
  >(false);
  expectType<
    TypeEqual<
      MixedSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(false);

  // @ts-expect-error
  slots.load(createSlot(() => {}));
});

test('manage mixed slots', () => {
  const mixedSlot1 = createSlot<{ a: string }>(() => {}, 'mixed');
  const mixedSlot2 = createSlot<{ b: number }>(() => {}, 'mixed');
  const mixedSlot3 = createSlot<{ c: object }>(() => {}, 'mixed');

  const slots = manageSlots('mixed')
    .load(mixedSlot1)
    .load(mixedSlot2)
    .load(mixedSlot3);

  expect(SlotManager.flatten(slots)).toHaveLength(3);
  expect(slots).toBeInstanceOf(MixedSlotManager);
  expectType<
    TypeEqual<
      MixedSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(true);
  expectType<
    TypeEqual<WebSlotManager<{ a: string; b: number; c: object }>, typeof slots>
  >(false);
  expectType<
    TypeEqual<
      ConsoleSlotManager<{ a: string; b: number; c: object }>,
      typeof slots
    >
  >(false);

  // @ts-expect-error
  slots.load(createSlot(() => {}));
  // @ts-expect-error
  slots.load(createSlot(() => {}, 'console'));
});

test('manager and manager', () => {
  const webSlots = manageSlots()
    .load(manageSlots())
    .load(manageSlots('mixed'))
    .load(manageSlots().load(createSlot<{ x: number }>(() => {})))
    .load(
      manageSlots('mixed')
        .load(createSlot<{ y: number }>(() => {}, 'mixed'))
        .load(createSlot(() => {}, 'mixed'))
        .load(createSlot<{ z: number }>(() => {}, 'mixed')),
    );
  expect(SlotManager.flatten(webSlots)).toHaveLength(4);
  expectType<
    TypeEqual<
      WebSlotManager<{ x: number; y: number; z: number }>,
      typeof webSlots
    >
  >(true);

  // @ts-expect-error
  manageSlots().load(manageSlots('console'));

  manageSlots('console')
    .load(manageSlots('console'))
    .load(manageSlots('mixed'));
  // @ts-expect-error
  manageSlots('console').load(manageSlots());

  manageSlots('mixed').load(manageSlots('mixed'));
  manageSlots('mixed')
    // @ts-expect-error
    .load(manageSlots('console'))
    // @ts-expect-error
    .load(manageSlots());
});

test('load empty slot', () => {
  manageSlots()
    .load(null)
    .load(null)
    // @ts-expect-error
    .load(undefined);

  manageSlots('console')
    .load(null)
    .load(null)
    // @ts-expect-error
    .load(undefined);

  manageSlots('mixed')
    .load(null)
    .load(null)
    // @ts-expect-error
    .load(undefined);
});

test('misc type checking', () => {
  manageSlots();
  // @ts-expect-error
  manageSlots('');
  // @ts-expect-error
  manageSlots('other');
});
