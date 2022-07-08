import EventEmitter from 'node:events';
import { Topic } from 'topic';
import { BaseRouter, BaseRouterParser } from '../router';
import { Slot, SlotManager } from '../slot';
import { composeToSlot } from '../utils/compose';
import { finder } from '../utils/finder';

interface AppOptions {
  paths: finder.Paths;
  globSlots?: SlotManager;
}

export abstract class App extends EventEmitter {
  protected _preSlotID: string | false = false;
  protected silent: boolean = false;
  protected readonly topic = new Topic<{
    ready: [];
  }>();
  protected readonly routerParser: BaseRouterParser;
  protected readonly middleware: Slot[] = [];
  protected readonly routerSlots: Slot[] = [];

  constructor(options: AppOptions) {
    super();
    this.buildMiddleware(options.globSlots);
    this.routerParser = this.createRouterParser();
    this.mountPath(options.paths);
    this.topic.keep('ready', () => this.routerParser.level === 0);
  }

  public get preSlotID(): string | false {
    return this._preSlotID;
  }

  public ready(): Promise<void> {
    return new Promise((resolve) => {
      this.topic.subscribeOnce('ready', resolve);
    });
  }

  public mountPath(paths: finder.Paths): Promise<void> {
    return this.routerParser.parsePath(paths).then(() => {
      this.maybeReady();
    });
  }

  protected mountRouter(routers: BaseRouter | BaseRouter[]) {
    return this.routerParser.parseRouter(routers);
  }

  protected buildMiddleware(globSlots: AppOptions['globSlots']) {
    const { middleware } = this;
    const slots = globSlots ? SlotManager.flatten(globSlots) : null;

    if (slots) {
      this._preSlotID = slots[slots.length - 1]?.createID() || false;
      middleware.push(composeToSlot(slots));
    }

    middleware.push(composeToSlot(this.routerSlots));
  }

  protected maybeReady(): void {
    if (this.routerParser.level === 0) {
      this.topic.publish('ready');
    }
  }

  protected abstract createRouterParser(): BaseRouterParser;
}
