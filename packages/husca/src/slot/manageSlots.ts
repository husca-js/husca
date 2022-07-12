import {
  ConsoleSlotManager,
  MixedSlotManager,
  SlotManager,
  WebSlotManager,
} from './SlotManager';
import { SlotTarget } from './SlotTarget';

export function manageSlots(target?: typeof SlotTarget[0]): WebSlotManager;
export function manageSlots(target: typeof SlotTarget[1]): ConsoleSlotManager;
export function manageSlots(target: typeof SlotTarget[2]): MixedSlotManager;
export function manageSlots(target: typeof SlotTarget[number]): SlotManager;
export function manageSlots(target: typeof SlotTarget[number] = SlotTarget[0]) {
  switch (target) {
    case SlotTarget[0]:
      return new WebSlotManager([]);
    case SlotTarget[1]:
      return new ConsoleSlotManager([]);
    case SlotTarget[2]:
      return new MixedSlotManager([]);
    default:
      const guard: never = target;
      return guard;
  }
}
