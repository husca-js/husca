import { pathToRegexp, Key } from 'path-to-regexp';
import {
  SlotTarget,
  createSlot,
  Slot,
  SlotManager,
  ConsoleSlotCompat,
  WebSlotCompat,
} from '../slot';
import { ConsoleCtx, WebCtx } from '../app';

type Union2Intersection<T> = (
  T extends any ? (arg: T) => void : never
) extends (arg: infer P) => void
  ? P
  : never;

export abstract class Builder<Props extends object = object> {
  protected declare _type_flag_: Props;

  public readonly slots: Slot[];

  constructor(
    slots: readonly (Slot | SlotManager)[] = [],
    fn?: (ctx: any) => Promise<any> | any,
  ) {
    this.slots = slots.reduce<Slot[]>((carry, slot) => {
      return carry.concat(SlotManager.flatten(slot));
    }, []);

    if (typeof fn === 'function') {
      /**
       * 不提供next的说明：
       * 1. 中间件本身就是洋葱模型，没必要后置
       * 2. next()可能会跳到另一个路由，但是因为加载路由顺序是随机的，所以这会导致重新启动后的行为不一致
       * 3. Router中增加了参数`throwIfMethodMismatch`，为了防止误判，匹配到路由之后就不能再匹配其它路由了
       */
      this.slots.push(createSlot(this.getTarget(), (ctx, _next) => fn(ctx)));
    }
  }

  protected abstract getTarget(): SlotTarget;
}

type PureUri = string | undefined;
const pureUriPattern = /^[\/a-z0-9-_]+$/i;
const duplicateSlash = /\/{2,}/g;
const suffixSlash = /\/+$/;

type WebSlot2Type<T> = T extends WebSlotCompat<infer R> ? R : object;

export interface RouterBuilderOptions<
  Props extends object,
  T extends WebSlotCompat<object>[] | [],
> {
  slots?: T;
  action?: (
    ctx: WebCtx<Props> & Union2Intersection<WebSlot2Type<T[number]>>,
  ) => any;
}

export class RouterBuilder<
  Props extends object = object,
  T extends WebSlotCompat<object>[] | [] = [],
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
    options: RouterBuilderOptions<Props, T>,
  ) {
    super(options.slots, options.action);
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

  public match(
    pathname: string,
    method: string,
  ): Record<string, unknown> | false {
    if (!this.methods.includes(method as any)) return false;

    const patterns = this.uriPatterns;
    const params: Record<string, any> = {};

    for (let i = patterns.length; i-- > 0; ) {
      const [regexp, keys, pureUri] = patterns[i]!;

      if (pureUri === pathname) return params;

      const matched = pathname.match(regexp);
      if (!matched) continue;
      if (matched.length < 2) return params;

      for (let keyIndex = matched.length; keyIndex-- > 1; ) {
        params[keys[keyIndex - 1]!.name] = RouterBuilder.decodeURIComponent(
          matched[keyIndex]!,
        );
      }

      return params;
    }

    return false;
  }

  public matchPathname(pathname: string): boolean {
    const patterns = this.uriPatterns;

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

  protected getTarget(): SlotTarget {
    return 'web';
  }
}

type ConsoleSlot2Type<T> = T extends ConsoleSlotCompat<infer R> ? R : object;

export interface CommanderBuilderOptions<
  Props extends object,
  T extends ConsoleSlotCompat<object>[] | [],
> {
  slots?: T;
  action?: (
    ctx: ConsoleCtx<Props> & Union2Intersection<ConsoleSlot2Type<T[number]>>,
  ) => any;
}

export class CommanderBuilder<
  Props extends object = object,
  T extends ConsoleSlotCompat<object>[] | [] = [],
> extends Builder<Props> {
  protected readonly commands: string[];

  constructor(
    prefix: string,
    commands: string[],
    options: CommanderBuilderOptions<Props, T>,
  ) {
    super(options.slots, options.action);
    this.commands = commands.map((item) => prefix + item);
  }

  public match(command: string): boolean {
    return this.commands.includes(command);
  }

  protected getTarget(): SlotTarget {
    return 'console';
  }
}
