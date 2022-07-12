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
  target?: typeof SlotTarget[0],
): WebSlot<Props>;

export function createSlot<Props extends object>(
  fn: ConsoleSlotFn<NonReadonly<Props>>,
  target: typeof SlotTarget[1],
): ConsoleSlot<Props>;

export function createSlot<Props extends object>(
  fn: MixedSlotFn<NonReadonly<Props>>,
  target: typeof SlotTarget[2],
): MixedSlot<Props>;

export function createSlot<Props extends object>(
  fn: MixedSlotFn<NonReadonly<Props>>,
  target: typeof SlotTarget[number],
): Slot<Props>;

export function createSlot(
  fn: (...args: any[]) => any,
  target: typeof SlotTarget[number] = SlotTarget[0],
) {
  switch (target) {
    case SlotTarget[0]:
      return new WebSlot(fn);
    case SlotTarget[1]:
      return new ConsoleSlot(fn);
    case SlotTarget[2]:
      return new MixedSlot(fn);
    default:
      const guard: never = target;
      return guard;
  }
}
