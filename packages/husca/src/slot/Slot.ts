import type { Document } from '../generator/Document';
import type { Next } from '../utils/compose';
import type {
  ConsoleSlotFn,
  MixedSlotFn,
  NonReadonly,
  WebSlotFn,
} from './types';

export abstract class Slot<Props extends object = object> {
  private declare _NOT_EXIST_: Props;

  protected static globalID = 0;

  protected id?: string;

  constructor(public readonly fn: (ctx: any, next: Next) => any) {}

  public createID(): string {
    return (this.id ||= Date.now() + '-' + Slot.globalID++);
  }

  public validate(id: string): boolean {
    return id === this.id;
  }

  public toDocument(): Document | null {
    return null;
  }
}

export class WebSlot<Props extends object> extends Slot<Props> {
  private declare _flag_: 'web-slot';

  constructor(fn: WebSlotFn<NonReadonly<Props>>) {
    super(fn);
  }
}

export class ConsoleSlot<Props extends object> extends Slot<Props> {
  private declare _flag_: 'console-slot';

  constructor(fn: ConsoleSlotFn<NonReadonly<Props>>) {
    super(fn);
  }
}

export class MixedSlot<Props extends object = object> extends Slot<Props> {
  private declare _flag_: 'mixed-slot';

  constructor(fn: MixedSlotFn<NonReadonly<Props>>) {
    super(fn);
  }
}