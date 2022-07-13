import { extname } from 'node:path';
import { ConsoleCtx, WebCtx } from '../app';
import type { Document } from '../document';
import type { Next } from '../utils/compose';
import { toArray } from '../utils/toArray';
import type {
  ConsoleSlotFn,
  ConsoleUnlessOptions,
  MixedSlotFn,
  MixedUnlessOptions,
  NonReadonly,
  UnlessOptions,
  WebSlotFn,
  WebUnlessOptions,
} from './types';

export abstract class Slot<Props extends object = object> {
  // 必须在 .d.ts 中强制使用Props，否则在使用阶段无法识别真实的Props类型
  protected declare _type_for_props_: Props;

  protected static globalID = 0;
  protected unlessFn?: (ctx: any, next: Next) => any;
  protected id?: string;

  constructor(public readonly _fn: (ctx: any, next: Next) => any) {}

  get fn() {
    return this.unlessFn || this._fn;
  }

  public createID(): string {
    return (this.id ||= Date.now() + '-' + Slot.globalID++);
  }

  public validate(id: string): boolean {
    return id === this.id;
  }

  public toDocument(): Document | null {
    return null;
  }

  protected unless(
    options: UnlessOptions | NonNullable<UnlessOptions['custom']>,
  ): this {
    const opts = typeof options === 'function' ? { custom: options } : options;
    this.unlessFn = (ctx, next) => {
      return this.shouldSkip(ctx, opts) ? next() : this._fn(ctx, next);
    };
    return this;
  }

  protected abstract shouldSkip(ctx: object, options: UnlessOptions): boolean;
}

export class WebSlot<Props extends object = object> extends Slot<Props> {
  protected declare _type_flag_: 'web-slot';

  constructor(fn: WebSlotFn<NonReadonly<Props>>) {
    super(fn);
  }

  public declare unless: (
    options: WebUnlessOptions | NonNullable<WebUnlessOptions['custom']>,
  ) => this;

  protected shouldSkip(ctx: WebCtx, options: WebUnlessOptions): boolean {
    if (options.custom?.(ctx)) return true;

    if (options.path) {
      const { pathname } = ctx.request;
      return toArray(options.path).some((path) =>
        typeof path === 'string'
          ? path === ctx.request.pathname
          : path.exec(pathname) !== null,
      );
    }

    if (options.ext) {
      const currentExt = extname(ctx.request.pathname);

      if (currentExt === '') return false;

      return toArray(options.ext).some((ext) => {
        return currentExt === (ext.startsWith('.') ? ext : `.${ext}`);
      });
    }

    if (options.method) {
      return toArray(options.method).includes(ctx.request.method);
    }

    return false;
  }
}

export class ConsoleSlot<Props extends object = object> extends Slot<Props> {
  protected declare _type_flag_: 'console-slot';

  constructor(fn: ConsoleSlotFn<NonReadonly<Props>>) {
    super(fn);
  }

  public declare unless: (
    options: ConsoleUnlessOptions | NonNullable<ConsoleUnlessOptions['custom']>,
  ) => this;

  protected shouldSkip(
    ctx: ConsoleCtx,
    options: ConsoleUnlessOptions,
  ): boolean {
    return options.custom(ctx);
  }
}

export class MixedSlot<Props extends object = object> extends Slot<Props> {
  protected declare _type_flag_: 'mixed-slot';

  constructor(fn: MixedSlotFn<NonReadonly<Props>>) {
    super(fn);
  }

  public declare unless: (
    options: MixedUnlessOptions | NonNullable<MixedUnlessOptions['custom']>,
  ) => this;

  protected shouldSkip(
    ctx: WebCtx | ConsoleCtx,
    options: MixedUnlessOptions,
  ): boolean {
    return options.custom(ctx);
  }
}
