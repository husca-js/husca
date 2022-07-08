import { Server } from 'http';
import createHttpError from 'http-errors';
import supertest from 'supertest';
import { expectType, TypeEqual } from 'ts-expect';
import { describe, expect, test, vitest } from 'vitest';
import {
  createSlot,
  HttpError,
  manageSlots,
  WebApp,
  WebCtx,
  WebRequest,
  WebResponse,
} from '../../src';

test('listen server', async () => {
  const app = new WebApp({
    routers: [],
    globalSlots: manageSlots('web').load(
      createSlot('web', (ctx) => {
        ctx.send(201, 'hello world');
      }),
    ),
  });

  const server = app.listen();
  expect(server).toBeInstanceOf(Server);
  await supertest(server).get('/').expect(201, 'hello world');
});

test('customize req and res', async () => {
  const app = new WebApp({
    routers: [],
    globalSlots: manageSlots('web').load(
      createSlot('web', (ctx) => {
        expect(ctx.request).toBeInstanceOf(WebRequest);
        expect(ctx.response).toBeInstanceOf(WebResponse);
      }),
    ),
  });

  await supertest(app.listen()).get('/');
});

test('default respond 404', async () => {
  const app = new WebApp({
    routers: [],
    globalSlots: manageSlots('web').load(createSlot('web', () => {})),
  });

  await supertest(app.listen()).get('/').expect(404);
});

test('execute middleware', async () => {
  const app = new WebApp({
    routers: [],
    globalSlots: manageSlots('web')
      .load(
        createSlot<{ data: string }>('web', async (ctx, next) => {
          ctx.data = '1';
          await next();
          ctx.data += '4';
          ctx.send(200, ctx.data);
        }),
      )
      .load(
        createSlot<{ data: string }>('web', async (ctx, next) => {
          ctx.data += '2';
          await next();
          ctx.data += '3';
        }),
      ),
  });

  await supertest(app.listen()).get('/').expect('1234');
});

describe('log', () => {
  test('throw TypeError for non error', () => {
    const app = new WebApp({
      routers: [],
    });

    // @ts-expect-error
    expect(() => app.log(null)).toThrowError(TypeError);
  });

  test('no stderr when setting silent', () => {
    const app = new WebApp({
      routers: [],
      silent: true,
    });

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError('msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('no stderr when statusCode<=500', () => {
    const app = new WebApp({
      routers: [],
    });

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError(400, 'msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('no stderr when setting err.status===404', () => {
    const app = new WebApp({
      routers: [],
    });

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError(404, 'msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('report error message', () => {
    const app = new WebApp({
      routers: [],
    });
    const spy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    app.log(createHttpError(500, 'msg'));
    expect(spy).toHaveBeenCalledTimes(1);
    app.log(createHttpError(503, 'msg'));
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});

test('type checking', () => {
  const app = new WebApp({ routers: [] });

  app.on('error', (err, ctx) => {
    expectType<TypeEqual<HttpError, typeof err>>(true);
    expectType<TypeEqual<WebCtx, typeof ctx>>(true);
  });
});
