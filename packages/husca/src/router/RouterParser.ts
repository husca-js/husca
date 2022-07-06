import { Slot } from '../slot';
import { finder } from '../utils/finder';
import { toArray } from '../utils/toArray';
import { Commander, BaseRouter, Router } from './Router';

export abstract class BaseRouterParser {
  public level: number = 0;
  protected loadedRouters: Set<BaseRouter> = new Set();

  constructor(
    protected readonly preSlotID: string | false,
    protected readonly routerSlots: Slot[],
  ) {}

  public async parsePath(paths: finder.Paths) {
    ++this.level;
    const files = await finder(paths);
    await this.parseRouterFromFile(files);
    --this.level;
  }

  public parseRouter(routers: BaseRouter | BaseRouter[]) {
    const { preSlotID } = this;

    toArray(routers).forEach((router) => {
      if (router && this.isRouter(router) && !this.loadedRouters.has(router)) {
        this.loadedRouters.add(router);
        this.routerSlots.push(BaseRouter.generateSlot(router, preSlotID));
      }
    });
  }

  protected parseRouterFromFile(files: string[]): Promise<void[]> {
    return Promise.all(
      files.map(async (file) => {
        const modules: Record<string, BaseRouter> = await import(file);
        this.parseRouter(Object.values(modules));
      }),
    );
  }

  protected abstract isRouter(router: any): router is BaseRouter;
}

export class RouterParser extends BaseRouterParser {
  protected isRouter(router: any): router is BaseRouter {
    return router instanceof Router;
  }
}

export class CommanderParser extends BaseRouterParser {
  protected isRouter(router: any): router is BaseRouter {
    return router instanceof Commander;
  }
}
