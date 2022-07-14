import {
  ConsoleSlotManager,
  MixedSlotManager,
  SlotManager,
  WebSlotManager,
} from './SlotManager';
import { SlotTarget } from './types';

export function manageSlots(target?: 'web'): WebSlotManager;
export function manageSlots(target: 'console'): ConsoleSlotManager;
export function manageSlots(target: 'mixed'): MixedSlotManager;
export function manageSlots(target: SlotTarget): SlotManager;
export function manageSlots(target: SlotTarget = 'web') {
  switch (target) {
    case 'web':
      return new WebSlotManager([]);
    case 'console':
      return new ConsoleSlotManager([]);
    case 'mixed':
      return new MixedSlotManager([]);
    default:
      const guard: never = target;
      return guard;
  }
}
