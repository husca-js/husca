import type { ConsoleCtx } from '../app/ConsoleContext';
import type { WebCtx } from '../app/WebContext';
import type { Next } from '../utils/compose';
import type { Slot, ConsoleSlot, MixedSlot, WebSlot } from './Slot';
import type {
  ConsoleSlotManager,
  MixedSlotManager,
  SlotManager,
  WebSlotManager,
} from './SlotManager';

export type NonReadonly<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export type GetSlotType<T extends Slot> = T extends Slot<infer R> ? R : never;

export type BaseSlotCompat<Props extends object> =
  | Slot<Props>
  | SlotManager<Props>;

export type WebSlotCompat<Props extends object> =
  | WebSlot<Props>
  | WebSlotManager<Props>
  | MixedSlotCompat<Props>;

export type ConsoleSlotCompat<Props extends object> =
  | ConsoleSlot<Props>
  | ConsoleSlotManager<Props>
  | MixedSlotCompat<Props>;

export type MixedSlotCompat<Props extends object> =
  | MixedSlot<Props>
  | MixedSlotManager<Props>;

export interface WebSlotFn<Props extends object> {
  (ctx: WebCtx<Props>, next: Next): any;
}
export interface ConsoleSlotFn<Props extends object> {
  (ctx: ConsoleCtx<Props>, next: Next): any;
}
export interface MixedSlotFn<Props extends object> {
  (ctx: WebCtx<Props> | ConsoleCtx<Props>, next: Next): any;
}
