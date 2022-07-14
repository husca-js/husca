import { Server } from 'http';
import createHttpError from 'http-errors';
import supertest from 'supertest';
import { describe, expect, test, vitest } from 'vitest';
import {
  createSlot,
  manageSlots,
  WebApp,
  WebRequest,
  WebResponse,
} from '../../src';

test('listen server', async () => {
  const app = new WebApp({
    globalSlots: manageSlots().load(
      createSlot((ctx) => {
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
    globalSlots: manageSlots().load(
      createSlot((ctx) => {
        expect(ctx.request).toBeInstanceOf(WebRequest);
        expect(ctx.response).toBeInstanceOf(WebResponse);
      }),
    ),
  });

  await supertest(app.listen()).get('/');
});

test('default respond 404', async () => {
  const app = new WebApp({
    globalSlots: manageSlots().load(createSlot(() => {})),
  });

  await supertest(app.listen()).get('/').expect(404);
});

test('execute middleware', async () => {
  const app = new WebApp({
    globalSlots: manageSlots()
      .load(
        createSlot<{ data: string }>(async (ctx, next) => {
          ctx.data = '1';
          await next();
          ctx.data += '4';
          ctx.send(200, ctx.data);
        }),
      )
      .load(
        createSlot<{ data: string }>(async (ctx, next) => {
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
    const app = new WebApp({});

    // @ts-expect-error
    expect(() => app.log(null)).toThrowError(TypeError);
  });

  test('no stderr when setting silent', () => {
    const app = new WebApp({
      silent: true,
    });

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError('msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('no stderr when statusCode<=500', () => {
    const app = new WebApp({});

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError(400, 'msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('no stderr when setting err.status===404', () => {
    const app = new WebApp({});

    const spy = vitest.spyOn(console, 'error');
    app.log(createHttpError(404, 'msg'));
    expect(spy).toHaveBeenCalledTimes(0);
    spy.mockRestore();
  });

  test('report error message', () => {
    const app = new WebApp({});
    const spy = vitest.spyOn(console, 'error').mockImplementation(() => {});
    app.log(createHttpError(500, 'msg'));
    expect(spy).toHaveBeenCalledTimes(1);
    app.log(createHttpError(503, 'msg'));
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
