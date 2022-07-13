import { describe, expect, test, vitest } from 'vitest';
import {
  ConsoleSlot,
  createSlot,
  manageSlots,
  Router,
  WebSlot,
} from '../../src';
import { BaseRouter, Commander, RouterBuilder } from '../../src/router';
import { composeToMiddleware } from '../../src/utils/compose';
import { noop } from '../helpers/noop';

describe('web router', () => {
  test('restful methods', () => {
    const router = new Router();

    RouterBuilder.METHODS.forEach((method) => {
      expect(router).toHaveProperty(method.toLowerCase());
      // @ts-ignore
      expect(router[method.toLowerCase()]).toBeTypeOf('function');
      // @ts-ignore
      expect(router[method.toLowerCase()]('', {})).toBeUndefined();
    });
  });

  test('additional "all" method', () => {
    const router = new Router();
    expect(router.all).toBeTypeOf('function');
    expect(router.all('', {})).toBeUndefined();
  });

  test('additional "customize" method', () => {
    const router = new Router();
    expect(router.customize).toBeTypeOf('function');
    expect(
      router.customize(['GET', 'POST', 'DELETE'], '/url', {}),
    ).toBeUndefined();
  });

  test('router is a slot', () => {
    const router = new Router();
    expect(Router.generateSlot(router, false)).toBeInstanceOf(WebSlot);
  });

  test('match router and call action', async () => {
    const router = new Router();
    const fn = vitest.fn();
    const fn1 = vitest.fn();

    router.get(['/a', '/b'], {
      action: fn,
    });
    router.get('/c', {
      action: fn1,
    });

    const middleware = composeToMiddleware([
      Router.generateSlot(router, false),
    ]);

    await middleware({
      request: {
        method: 'GET',
        pathname: '/a',
      },
    });
    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockReset();

    await middleware({
      request: {
        method: 'GET',
        pathname: '/b',
      },
    });
    expect(fn).toHaveBeenCalledTimes(1);
    fn.mockReset();

    await middleware({
      request: {
        method: 'POST',
        pathname: '/b',
      },
    });
    expect(fn).toHaveBeenCalledTimes(0);
    fn.mockReset();
  });

  test('collect params', async () => {
    const router = new Router();
    router.get('/api/users/:id/books/:bookId', {});
    const middleware = composeToMiddleware([
      Router.generateSlot(router, false),
    ]);
    const ctx = {
      request: {
        params: null,
        method: 'GET',
        pathname: '/api/users/2/books/15',
      },
    };

    expect(ctx.request.params).toBeNull();
    await middleware(ctx);
    expect(ctx.request.params).toMatchObject({
      id: '2',
      bookId: '15',
    });
  });

  test('throw 405 status when path is matched but method mismatched', async () => {
    const router = new Router({
      throwIfMethodMisMatch: true,
    });

    router.get('/api', {});

    const fn = vitest.fn();
    const middleware = composeToMiddleware([
      Router.generateSlot(router, false),
    ]);
    await middleware({
      throw: fn,
      request: {
        method: 'POST',
        pathname: '/api',
      },
    });
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(405);
    fn.mockReset();

    await middleware({
      throw: fn,
      request: {
        method: 'POST',
        pathname: '/api/x',
      },
    });
    expect(fn).toHaveBeenCalledTimes(0);
  });

  test('group slots', async () => {
    const createCustomSlot = <T extends object>(
      v1: string,
      v2: string,
    ): WebSlot<T> => {
      return createSlot<T>(async (_, next) => {
        data += v1;
        await next();
        data += v2;
      });
    };

    const updateRouter = (router: Router) => {
      router.get('/api', {
        slots: [createCustomSlot('r1', 'r2')],
      });
    };

    let data = '';
    const globalLastSlot = createCustomSlot('3', '8');
    const globalSlots = manageSlots()
      .load(createCustomSlot('1', 'a'))
      .load(createCustomSlot<{ hello: 'world' }>('2', '9'))
      .load(globalLastSlot);
    const globalSlotID = globalLastSlot.createID();
    const groupSlots = globalSlots
      .load(createCustomSlot('4', '7'))
      .load(createCustomSlot('5', '6'));

    // global-slot + group-slot + router-slot
    const router1 = new Router({
      groupSlots,
    });
    updateRouter(router1);
    const middleware = composeToMiddleware([
      Router.generateSlot(router1, globalSlotID),
    ]);

    data = '';
    await middleware({
      request: {
        method: 'GET',
        pathname: '/api',
      },
    });
    expect(data).toBe('45r1r267');

    data = '';
    await middleware({
      request: {
        method: 'POST',
        pathname: '/not/found',
      },
    });
    expect(data).toBe('');

    // global-slot + router-slot
    const router2 = new Router({
      groupSlots: globalSlots,
    });
    updateRouter(router2);
    const middleware2 = composeToMiddleware([
      Router.generateSlot(router2, globalSlotID),
    ]);
    data = '';
    await middleware2({
      request: {
        method: 'GET',
        pathname: '/api',
      },
    });
    expect(data).toBe('r1r2');

    // global-slot => group-slot
    const router3 = new Router({
      groupSlots,
    });
    updateRouter(router3);
    const middleware3 = composeToMiddleware([
      Router.generateSlot(router3, 'random id'),
    ]);
    data = '';
    await middleware3({
      request: {
        method: 'GET',
        pathname: '/api',
      },
    });
    expect(data).toBe('12345r1r26789a');
    data = '';
    await middleware3({
      request: {
        method: 'POST',
        pathname: '/not/found',
      },
    });
    expect(data).toBe('');
  });
});

describe('console commander', () => {
  const createCtx = (command: string) => ({
    request: {
      command,
    },
    response: {
      commandMatched: false,
    },
  });

  test('create command', () => {
    const commander = new Commander();
    expect(commander.create('test/me', {})).toBeUndefined();
  });

  test('commander is a slot', () => {
    const commander = new Commander();
    const slot = BaseRouter.generateSlot(commander, false);
    expect(slot).toBeInstanceOf(ConsoleSlot);
  });

  test('match command', async () => {
    const commander = new Commander();
    commander.create('test/me', {
      action: noop,
    });

    const middleware = composeToMiddleware([
      BaseRouter.generateSlot(commander, false),
    ]);

    await Promise.all(
      ['/test/me', 'test.me', 'test:me', 'testme', 'test/me/'].map(
        async (str) => {
          const ctx = createCtx(str);
          await middleware(ctx);
          expect(ctx.response.commandMatched).toBeFalsy();
        },
      ),
    );

    const ctx = createCtx('test/me');
    await middleware(ctx);
    expect(ctx.response.commandMatched).toBeTruthy();
  });

  test('group slots', async () => {
    const createCustomSlot = <T extends object>(
      v1: string,
      v2: string,
    ): ConsoleSlot<T> => {
      return createSlot<T>('console', async (_, next) => {
        data += v1;
        await next();
        data += v2;
      });
    };

    const updateRouter = (commander: Commander) => {
      commander.create('test/me', {
        slots: [createCustomSlot('r1', 'r2')],
      });
    };

    let data = '';
    const globalLastSlot = createCustomSlot('3', '8');
    const globalSlots = manageSlots('console')
      .load(createCustomSlot('1', 'a'))
      .load(createCustomSlot<{ hello: 'world' }>('2', '9'))
      .load(globalLastSlot);
    const globalSlotID = globalLastSlot.createID();
    const groupSlots = globalSlots
      .load(createCustomSlot('4', '7'))
      .load(createCustomSlot('5', '6'));

    // global-slot + group-slot + router-slot
    const router1 = new Commander({
      groupSlots,
    });
    updateRouter(router1);
    const middleware = composeToMiddleware([
      Router.generateSlot(router1, globalSlotID),
    ]);

    data = '';
    await middleware(createCtx('test/me'));
    expect(data).toBe('45r1r267');

    data = '';
    await middleware(createCtx('notfound'));
    expect(data).toBe('');

    // global-slot + router-slot
    const router2 = new Commander({
      groupSlots: globalSlots,
    });
    updateRouter(router2);
    const middleware2 = composeToMiddleware([
      Router.generateSlot(router2, globalSlotID),
    ]);
    data = '';
    await middleware2(createCtx('test/me'));
    expect(data).toBe('r1r2');

    // global-slot => group-slot
    const router3 = new Commander({
      groupSlots,
    });
    updateRouter(router3);
    const middleware3 = composeToMiddleware([
      Router.generateSlot(router3, 'random id'),
    ]);
    data = '';
    await middleware3(createCtx('test/me'));
    expect(data).toBe('12345r1r26789a');
    data = '';
    await middleware3(createCtx('notfound'));
    expect(data).toBe('');
  });
});
