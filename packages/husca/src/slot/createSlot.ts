import { ConsoleSlot, MixedSlot, Slot, WebSlot } from './Slot';
import type {
  ConsoleSlotFn,
  MixedSlotFn,
  NonReadonly,
  WebSlotFn,
  SlotTarget,
} from './types';

export function createSlot<Props extends object>(
  fn: WebSlotFn<NonReadonly<Props>>,
): WebSlot<Props>;

export function createSlot<Props extends object>(
  target: 'web',
  fn: WebSlotFn<NonReadonly<Props>>,
): WebSlot<Props>;

export function createSlot<Props extends object>(
  target: 'console',
  fn: ConsoleSlotFn<NonReadonly<Props>>,
): ConsoleSlot<Props>;

export function createSlot<Props extends object>(
  target: 'mixed',
  fn: MixedSlotFn<NonReadonly<Props>>,
): MixedSlot<Props>;

export function createSlot<Props extends object>(
  target: SlotTarget,
  fn: MixedSlotFn<NonReadonly<Props>>,
): Slot<Props>;

export function createSlot(
  target: SlotTarget | ((...args: any[]) => any),
  fn?: (...args: any[]) => any,
) {
  if (typeof target === 'function') {
    fn = target;
    target = 'web';
  }

  switch (target) {
    case 'web':
      return new WebSlot(fn!);
    case 'console':
      return new ConsoleSlot(fn!);
    case 'mixed':
      return new MixedSlot(fn!);
    default:
      const guard: never = target;
      return guard;
  }
}
