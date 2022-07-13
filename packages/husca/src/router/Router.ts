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
} from '../slot';
import { SlotTarget } from '../slot/SlotTarget';
import { composeToMiddleware } from '../utils/compose';
import { toArray } from '../utils/toArray';
import { Builder, CommanderBuilder, RouterBuilder } from './Builder';

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

  public get(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['GET', 'HEAD']);
  }

  public post(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['POST']);
  }

  public put(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['PUT']);
  }

  public patch(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['PATCH']);
  }

  public delete(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['DELETE']);
  }

  public head(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['HEAD']);
  }

  public options(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, ['OPTIONS']);
  }

  public all(uri: string | string[]): RouterBuilder<Props> {
    return this.create(uri, RouterBuilder['METHODS'].slice());
  }

  public customize(
    methods: typeof RouterBuilder['METHODS'][number][],
    uri: string | string[],
  ): RouterBuilder<Props> {
    return this.create(uri, methods);
  }

  protected create(
    uri: string | string[],
    methods: typeof RouterBuilder['METHODS'][number][],
  ): RouterBuilder<Props> {
    const builder = new RouterBuilder<Props>(
      this.prefix,
      toArray(uri),
      methods,
    );
    this.builders.push(builder);
    return builder;
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
        const params = RouterBuilder.match(builder, pathname, method);

        if (params) {
          request.params = params;
          slots = Builder.getSlots(builder);
          break;
        }
      }

      if (slots) {
        return composeToMiddleware(groupSlots.concat(slots))(ctx, next);
      }

      if (throwIfMethodMismatch) {
        for (let i = 0; i < builders.length; ++i) {
          if (RouterBuilder.matchPathname(builders[i]!, pathname)) {
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

  public create(command: string | string[]): CommanderBuilder<Props> {
    const builder = new CommanderBuilder<Props>(this.prefix, toArray(command));
    this.builders.push(builder);
    return builder;
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

        if (CommanderBuilder.match(builder, command)) {
          ctx.response.commandMatched = true;
          return composeToMiddleware(
            groupSlots.concat(Builder.getSlots(builder)),
          )(ctx, next);
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
