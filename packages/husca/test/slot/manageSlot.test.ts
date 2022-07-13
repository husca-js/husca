import { expect, test } from 'vitest';
import { createSlot, manageSlots } from '../../src';
import {
  SlotManager,
  WebSlotManager,
  ConsoleSlotManager,
  MixedSlotManager,
} from '../../src/slot';
import { SlotTarget } from '../../src/slot/SlotTarget';
import { noop } from '../helpers/noop';

test('manager instance', () => {
  expect(manageSlots()).toBeInstanceOf(WebSlotManager);
  expect(manageSlots('web')).toBeInstanceOf(WebSlotManager);
  expect(manageSlots('console')).toBeInstanceOf(ConsoleSlotManager);
  expect(manageSlots('mixed')).toBeInstanceOf(MixedSlotManager);
});

test('manage slots', () => {
  for (const key of SlotTarget) {
    const slot1 = createSlot<{ a: string }>(key, noop);
    const slot2 = createSlot<{ b: number }>(key, noop);
    const slot3 = createSlot<{ c: object }>('mixed', noop);
    const slots = manageSlots(key).load(slot1).load(slot2).load(slot3);
    expect(SlotManager.flatten(slots)).toHaveLength(3);
  }
});

test('manager in manager', () => {
  for (const key of SlotTarget) {
    const slots = manageSlots(key)
      .load(manageSlots(key))
      .load(manageSlots('mixed'))
      .load(manageSlots(key).load(createSlot(noop)))
      .load(
        manageSlots('mixed')
          .load(createSlot('mixed', noop))
          .load(createSlot('mixed', noop))
          .load(createSlot('mixed', noop)),
      );
    expect(SlotManager.flatten(slots)).toHaveLength(4);
  }
});

test('manage null slot', () => {
  for (const key of SlotTarget) {
    const slots = manageSlots(key)
      .load(null)
      .load(manageSlots('mixed'))
      .load(manageSlots(key).load(createSlot(noop)))
      .load(
        manageSlots('mixed')
          .load(null)
          .load(createSlot('mixed', noop))
          .load(null),
      );
    expect(SlotManager.flatten(slots)).toHaveLength(2);
  }
});
