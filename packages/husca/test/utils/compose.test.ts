import { expect, test, vitest } from 'vitest';
import { createSlot, MixedSlot } from '../../src';
import { composeToMiddleware, composeToSlot } from '../../src/utils/compose';

test('compose to middleware', async () => {
  const fn1 = vitest.fn().mockImplementation((_, next) => next());
  const fn2 = vitest.fn().mockImplementation((_, next) => next());
  const fn3 = vitest.fn().mockImplementation(() => 'succeed');

  const slots = [createSlot(fn1), createSlot(fn2)];
  const middleware = composeToMiddleware(slots);

  expect(middleware).toBeTypeOf('function');

  const result = await middleware({}, fn3);
  expect(fn1).toHaveBeenCalledOnce();
  expect(fn2).toHaveBeenCalledOnce();
  expect(fn3).toHaveBeenCalledOnce();
  expect(result).toBe('succeed');
});

test('middleware executing order', async () => {
  let data = '';

  const fn1 = vitest.fn().mockImplementation(async (_, next) => {
    data += '1';
    await next();
    data += '5';
  });
  const fn2 = vitest.fn().mockImplementation(async (_, next) => {
    data += '2';
    await next();
    data += '4';
  });
  const fn3 = vitest.fn().mockImplementation(async (_) => {
    data += '3';
  });

  const slots = [createSlot(fn1), createSlot(fn2)];

  await composeToMiddleware(slots)({}, fn3);
  expect(data).toBe('12345');
});

test('compose to slot', () => {
  const fn1 = vitest.fn().mockImplementation((_, next) => next());
  const fn2 = vitest.fn().mockImplementation((_, next) => next());

  const slots = [createSlot(fn1), createSlot(fn2)];
  const slot = composeToSlot(slots);

  expect(slot).toBeInstanceOf(MixedSlot);
});

test('composed slot in middleware', async () => {
  let data = '';

  const fn1 = vitest.fn().mockImplementation(async (_, next) => {
    data += '1';
    await next();
    data += '-11-';
  });
  const fn2 = vitest.fn().mockImplementation(async (_, next) => {
    data += '2';
    await next();
    data += '-10-';
  });
  const fn3 = vitest.fn().mockImplementation(async (_, next) => {
    data += '3';
    await next();
    data += '9';
  });
  const fn4 = vitest.fn().mockImplementation(async (_, next) => {
    data += '4';
    await next();
    data += '8';
  });
  const fn5 = vitest.fn().mockImplementation(async (_, next) => {
    data += '5';
    await next();
    data += '7';
  });
  const fn6 = vitest.fn().mockImplementation(async (_) => {
    data += '6';
  });

  const slots = [
    createSlot(fn1),
    createSlot(fn2),
    composeToSlot([createSlot(fn3, 'mixed'), createSlot(fn4, 'console')]),
    createSlot(fn5, 'mixed'),
  ];

  await composeToMiddleware(slots)({}, fn6);
  expect(data).toBe('123456789-10--11-');
});

test('stop forwarding when next() is not called', async () => {
  let data = '';

  const fn1 = vitest.fn().mockImplementation(async (_, next) => {
    data += '1';
    await next();
    data += '3';
  });
  const fn2 = vitest.fn().mockImplementation(async () => {
    data += '2';
  });
  const fn3 = vitest.fn().mockImplementation(async (_, next) => {
    data += 'never';
    await next();
    data += 'never';
  });

  const slots = [createSlot(fn1), createSlot(fn2), createSlot(fn3)];

  await composeToMiddleware(slots)({});
  expect(data).toBe('123');
});

test('never call next twice', async () => {
  await expect(
    composeToMiddleware([
      createSlot(async (_, next) => {
        await next();
      }),
    ])({}),
  ).to.resolves.toBeUndefined();

  await expect(
    composeToMiddleware([
      createSlot(async (_, next) => {
        await next();
        await next();
      }),
    ])({}),
  ).to.rejects.toThrowError('next() called multiple times');
});

test('throw error', async () => {
  await expect(
    composeToMiddleware([
      createSlot(() => {
        throw new Error('test error!');
      }),
    ])({}),
  ).to.rejects.toThrowError('test error!');
});

test('context', async () => {
  const fn1 = vitest.fn().mockImplementation(async (ctx, next) => {
    ctx.data += '1';
    await next();
    ctx.data += '5';
  });
  const fn2 = vitest.fn().mockImplementation(async (ctx, next) => {
    ctx.data += '2';
    await next();
    ctx.data += '4';
  });
  const fn3 = vitest.fn().mockImplementation(async (ctx) => {
    ctx.data += '3';
  });

  const slots = [createSlot(fn1), createSlot(fn2)];
  const context = { data: '' };

  await composeToMiddleware(slots)(context, fn3);
  expect(context.data).toBe('12345');
});

test('type checking', () => {
  const middleware = composeToMiddleware([]);

  middleware({}).then().catch();
  middleware({}, () => new Promise(() => {}));
  middleware({}, async () => {});

  // @ts-expect-error
  middleware();
  // @ts-expect-error
  middleware({}, () => {});
});
