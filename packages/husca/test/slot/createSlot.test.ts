import { expect, test } from 'vitest';
import { ConsoleSlot, createSlot, MixedSlot, WebSlot } from '../../src';
import { noop } from '../helpers/noop';

test('slot instance', () => {
  expect(createSlot(noop)).toBeInstanceOf(WebSlot);
  expect(createSlot(noop, 'web')).toBeInstanceOf(WebSlot);
  expect(createSlot(noop, 'console')).toBeInstanceOf(ConsoleSlot);
  expect(createSlot(noop, 'mixed')).toBeInstanceOf(MixedSlot);
});

test('generate unique ID', () => {
  const slot = createSlot(noop);
  const id = slot.createID();
  expect(slot.createID()).toBe(id);
  expect(slot.validate(id)).toBeTruthy();
  expect(slot.validate('xyz')).toBeFalsy();

  const slot2 = createSlot(noop);
  expect(slot2.createID()).not.toBe(id);
});
