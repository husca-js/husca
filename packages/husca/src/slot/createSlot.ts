import { ConsoleSlot, MixedSlot, Slot, WebSlot } from './Slot';
import { SlotTarget } from './SlotTarget';
import type {
  ConsoleSlotFn,
  MixedSlotFn,
  NonReadonly,
  WebSlotFn,
} from './types';

export function createSlot<Props extends object>(
  fn: WebSlotFn<NonReadonly<Props>>,
): WebSlot<Props>;

export function createSlot<Props extends object>(
  target: typeof SlotTarget[0],
  fn: WebSlotFn<NonReadonly<Props>>,
): WebSlot<Props>;

export function createSlot<Props extends object>(
  target: typeof SlotTarget[1],
  fn: ConsoleSlotFn<NonReadonly<Props>>,
): ConsoleSlot<Props>;

export function createSlot<Props extends object>(
  target: typeof SlotTarget[2],
  fn: MixedSlotFn<NonReadonly<Props>>,
): MixedSlot<Props>;

export function createSlot<Props extends object>(
  target: typeof SlotTarget[number],
  fn: MixedSlotFn<NonReadonly<Props>>,
): Slot<Props>;

export function createSlot(
  target: typeof SlotTarget[number] | ((...args: any[]) => any),
  fn?: (...args: any[]) => any,
) {
  if (typeof target === 'function') {
    fn = target;
    target = SlotTarget[0];
  }

  switch (target) {
    case SlotTarget[0]:
      return new WebSlot(fn!);
    case SlotTarget[1]:
      return new ConsoleSlot(fn!);
    case SlotTarget[2]:
      return new MixedSlot(fn!);
    default:
      const guard: never = target;
      return guard;
  }
}
