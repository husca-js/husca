import {
  createSlot,
  manageSlots,
  ConsoleSlot,
  Slot,
  WebSlot,
  ConsoleSlotManager,
  SlotManager,
  WebSlotManager,
  ConsoleSlotFn,
  WebSlotFn,
  WebSlotCompat,
  ConsoleSlotCompat,
} from '../slot';
import { SlotTarget } from '../slot/SlotTarget';
import { composeToMiddleware } from '../utils/compose';
import { toArray } from '../utils/toArray';
import {
  Builder,
  CommanderBuilder,
  CommanderBuilderOptions,
  RouterBuilder,
  RouterBuilderOptions,
} from './Builder';

export abstract class BaseRouter<Props extends object = object> {
  public static generateSlot<Props extends object>(
    router: BaseRouter<Props>,
    globalSlotID: string | false,
  ): Slot<Props> {
    return router.generateSlot(globalSlotID);
  }

  protected readonly slots: SlotManager<Props>;
  protected readonly builders: Builder[] = [];

  constructor(slots?: SlotManager<Props>) {
    this.slots = slots || manageSlots(this.getTarget());
  }

  protected cutGlobalSlots(globalSlotID: string | false): Slot[] {
    const slots = SlotManager.flatten(this.slots);
    if (!globalSlotID) return slots;
    const index = slots.findIndex((slot) => slot.validate(globalSlotID));
    return index === -1 ? slots : slots.slice(index + 1);
  }

  protected abstract generateSlot(globalSlotID: string | false): Slot<Props>;
  protected abstract getTarget(): typeof SlotTarget[number];
}

export interface RouterOptions<Props extends object = object> {
  prefix?: string;
  groupSlots?: WebSlotManager<Props>;
  throwIfMethodMisMatch?: boolean;
}

export class Router<Props extends object = object> extends BaseRouter<Props> {
  protected readonly prefix: string;
  protected readonly throwIfMethodMismatch: boolean;

  protected declare readonly builders: RouterBuilder[];

  constructor(options: RouterOptions<Props> = {}) {
    super(options.groupSlots);
    this.prefix = options.prefix || '';
    this.throwIfMethodMismatch = options.throwIfMethodMisMatch || false;
  }

  public get<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['GET', 'HEAD'], options);
  }

  public post<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['POST'], options);
  }

  public put<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['PUT'], options);
  }

  public patch<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['PATCH'], options);
  }

  public delete<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['DELETE'], options);
  }

  public head<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['HEAD'], options);
  }

  public options<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, ['OPTIONS'], options);
  }

  public all<T extends WebSlotCompat<object>[] | []>(
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, RouterBuilder['METHODS'].slice(), options);
  }

  public customize<T extends WebSlotCompat<object>[] | []>(
    methods: typeof RouterBuilder['METHODS'][number][],
    uri: string | string[],
    options: RouterBuilderOptions<Props, T>,
  ): void {
    return this.create(uri, methods, options);
  }

  protected create(
    uri: string | string[],
    methods: typeof RouterBuilder['METHODS'][number][],
    options: RouterBuilderOptions<Props, any[]>,
  ): void {
    const builder = new RouterBuilder(
      this.prefix,
      toArray(uri),
      methods,
      options,
    );
    this.builders.push(builder);
    return;
  }

  protected override generateSlot(
    globalSlotID: string | false,
  ): WebSlot<Props> {
    const builders = this.builders;
    const throwIfMethodMismatch = this.throwIfMethodMismatch;
    const groupSlots = this.cutGlobalSlots(globalSlotID);

    const middleware: WebSlotFn<Props> = (ctx, next) => {
      const { request } = ctx;
      const { pathname } = request;
      const method = request.method.toUpperCase();
      let slots: Slot[] | null = null;

      for (let i = 0; i < builders.length; ++i) {
        const builder = builders[i]!;
        const params = builder.match(pathname, method);

        if (params) {
          request.params = params;
          slots = builder.slots;
          break;
        }
      }

      if (slots) {
        return composeToMiddleware(groupSlots.concat(slots))(ctx, next);
      }

      if (throwIfMethodMismatch) {
        for (let i = 0; i < builders.length; ++i) {
          if (builders[i]!.matchPathname(pathname)) {
            ctx.throw(405);
          }
        }
      }

      return next();
    };

    return createSlot(this.getTarget(), middleware);
  }

  protected override getTarget() {
    return SlotTarget[0];
  }
}

export interface CommanderOptions<Props extends object = object> {
  prefix?: string;
  groupSlots?: ConsoleSlotManager<Props>;
}

export class Commander<
  Props extends object = object,
> extends BaseRouter<Props> {
  protected readonly prefix: string;

  protected declare readonly builders: CommanderBuilder[];

  constructor(options: CommanderOptions<Props> = {}) {
    super(options.groupSlots);
    this.prefix = options.prefix || '';
  }

  public create<T extends ConsoleSlotCompat<object>[] | []>(
    command: string | string[],
    options: CommanderBuilderOptions<Props, T>,
  ): void {
    const builder = new CommanderBuilder<Props, T>(
      this.prefix,
      toArray(command),
      options,
    );
    this.builders.push(builder);
    return;
  }

  protected override generateSlot(
    globalSlotID: string | false,
  ): ConsoleSlot<Props> {
    const builders = this.builders;
    const groupSlots = this.cutGlobalSlots(globalSlotID);

    const middleware: ConsoleSlotFn<Props> = (ctx, next) => {
      const { command } = ctx.request;

      for (let i = 0; i < builders.length; ++i) {
        const builder = builders[i]!;

        if (builder.match(command)) {
          ctx.response.commandMatched = true;
          return composeToMiddleware(groupSlots.concat(builder.slots))(
            ctx,
            next,
          );
        }
      }

      return next();
    };

    return createSlot(this.getTarget(), middleware);
  }

  protected override getTarget() {
    return SlotTarget[1];
  }
}
