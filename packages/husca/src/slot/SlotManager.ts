import type { Slot } from './Slot';
import type {
  BaseSlotCompat,
  ConsoleSlotCompat,
  MixedSlotCompat,
  WebSlotCompat,
} from './types';

export abstract class SlotManager<Props extends object = object> {
  public static flatten(slot: BaseSlotCompat<object> | null): Slot[] {
    return slot === null
      ? []
      : slot instanceof SlotManager
      ? slot.slots.slice()
      : [slot];
  }

  protected readonly SubClass: new (...args: any[]) => SlotManager;

  constructor(protected readonly slots: Slot[]) {
    // @ts-expect-error
    this.SubClass = new.target;
  }

  load<P extends object>(
    slot: BaseSlotCompat<P> | null,
  ): SlotManager<Props & P> {
    return new this.SubClass(this.slots.concat(SlotManager.flatten(slot)));
  }
}

export class WebSlotManager<
  Props extends object = object,
> extends SlotManager<Props> {
  protected declare _type_flag_: 'web-slot-manager';

  declare load: {
    <P extends object>(slot: WebSlotCompat<P> | null): WebSlotManager<
      Props & P
    >;
  };
}

export class ConsoleSlotManager<
  Props extends object = object,
> extends SlotManager<Props> {
  protected declare _type_flag_: 'console-slot-manager';

  declare load: {
    <P extends object>(slot: ConsoleSlotCompat<P> | null): ConsoleSlotManager<
      Props & P
    >;
  };
}

export class MixedSlotManager<
  Props extends object = object,
> extends SlotManager<Props> {
  protected declare _type_flag_: 'mixed-slot-manager';

  declare load: {
    <P extends object>(slot: MixedSlotCompat<P> | null): MixedSlotManager<
      Props & P
    >;
  };
}
