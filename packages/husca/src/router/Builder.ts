import { pathToRegexp, Key } from 'path-to-regexp';
import { SlotTarget } from '../slot/SlotTarget';
import {
  createSlot,
  Slot,
  SlotManager,
  BaseSlotCompat,
  ConsoleSlotCompat,
  WebSlotCompat,
} from '../slot';
import { ConsoleCtx, WebCtx } from '../app';

export abstract class Builder<Props extends object = object> {
  protected readonly slots: Slot[] = [];

  public static getSlots(builder: Builder) {
    return builder.slots;
  }

  load<P extends object>(slot: BaseSlotCompat<P> | null): Builder<Props & P> {
    this.slots.push(...SlotManager.flatten(slot));
    return this;
  }

  /**
   * 不提供next的说明：
   * 1. 中间件本身就是洋葱模型，没必要后置
   * 2. next()可能会跳到另一个路由，但是因为加载路由顺序是随机的，所以这会导致重新启动后的行为不一致
   * 3. Router中增加了参数`throwIfMethodMismatch`，为了防止误判，匹配到路由之后就不能再匹配其它路由了
   */
  action(fn: (ctx: any) => Promise<any> | any): void {
    const slot = createSlot(this.getTarget(), (ctx, _next) => fn(ctx));
    this.slots.push(slot);
  }

  protected abstract getTarget(): typeof SlotTarget[number];
}

type PureUri = string | undefined;
const pureUriPattern = /^[\/a-z0-9-_]+$/i;
const duplicateSlash = /\/{2,}/g;
const suffixSlash = /\/+$/;

export class RouterBuilder<
  Props extends object = object,
> extends Builder<Props> {
  public static METHODS = <const>[
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'HEAD',
    'OPTIONS',
  ];

  protected readonly uriPatterns: [RegExp, Key[], PureUri][];

  constructor(
    prefix: string,
    protected readonly uris: string[],
    protected readonly methods: typeof RouterBuilder['METHODS'][number][],
  ) {
    super();
    const uriPatterns: typeof this.uriPatterns = (this.uriPatterns = []);

    for (let i = uris.length; i-- > 0; ) {
      const uri = (uris[i] = ('/' + prefix + uris[i]!)
        .replace(suffixSlash, '')
        .replaceAll(duplicateSlash, '/'));
      const keysRef: Key[] = [];

      uriPatterns.push([
        pathToRegexp(uri, keysRef),
        keysRef,
        pureUriPattern.test(uri) ? uri : void 0,
      ]);
    }
  }

  public static match(
    builder: RouterBuilder,
    pathname: string,
    method: string,
  ): Record<string, unknown> | false {
    if (!builder.methods.includes(method as any)) return false;

    const patterns = builder.uriPatterns;
    const params: Record<string, any> = {};

    for (let i = patterns.length; i-- > 0; ) {
      const [regexp, keys, pureUri] = patterns[i]!;

      if (pureUri === pathname) return params;

      const matched = pathname.match(regexp);
      if (!matched) continue;
      if (matched.length < 2) return params;

      for (let keyIndex = matched.length; keyIndex-- > 1; ) {
        params[keys[keyIndex - 1]!.name] = this.decodeURIComponent(
          matched[keyIndex]!,
        );
      }

      return params;
    }

    return false;
  }

  public static matchPathname(
    builder: RouterBuilder,
    pathname: string,
  ): boolean {
    const patterns = builder.uriPatterns;

    for (let i = patterns.length; i-- > 0; ) {
      const [regexp, , pureUri] = patterns[i]!;
      if (pureUri === pathname || regexp.test(pathname)) return true;
    }

    return false;
  }

  protected static decodeURIComponent(text: string): any {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }

  declare load: <P extends object>(
    slot: WebSlotCompat<P> | null,
  ) => RouterBuilder<Props & P>;

  declare action: (fn: (ctx: WebCtx<Props>) => any) => void;

  protected getTarget() {
    return SlotTarget[0];
  }
}

export class CommanderBuilder<
  Props extends object = object,
> extends Builder<Props> {
  protected readonly commands: string[];

  constructor(prefix: string, commands: string[]) {
    super();
    this.commands = commands.map((item) => prefix + item);
  }

  public static match(
    builder: CommanderBuilder<object>,
    command: string,
  ): boolean {
    return builder.commands.includes(command);
  }

  declare load: <P extends object>(
    slot: ConsoleSlotCompat<P> | null,
  ) => CommanderBuilder<Props & P>;

  declare action: (fn: (ctx: ConsoleCtx<Props>) => any) => void;

  protected getTarget() {
    return SlotTarget[1];
  }
}
