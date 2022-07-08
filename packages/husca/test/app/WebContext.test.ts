import { Socket } from 'net';
import { Stream } from 'stream';
import supertest from 'supertest';
import { describe, expect, test } from 'vitest';
import {
  createSlot,
  HttpError,
  manageSlots,
  WebApp,
  WebRequest,
  WebResponse,
} from '../../src';
import { WebContext } from '../../src/app';

const createCtx = () => {
  const request = new WebRequest(new Socket());
  const response = new WebResponse(request);
  const app = new WebApp({ routers: [] });
  return new WebContext(app, request, response);
};

test('connect request and response', async () => {
  const request = new WebRequest(new Socket());
  const response = new WebResponse(request);
  const app = new WebApp({ routers: [] });
  const ctx = new WebContext(app, request, response);

  expect(ctx.request).toBe(request);
  expect(ctx.response).toBe(response);
  expect(ctx.app).toBe(app);

  expect(ctx.request.app).toBe(app);
  expect(ctx.response.app).toBe(app);

  expect(ctx.request.ctx).toBe(ctx);
  expect(ctx.response.ctx).toBe(ctx);

  expect(ctx.request.res).toBe(response);
  expect(ctx.response.req).toBe(request);
});

test('throw HttpError', () => {
  const ctx = createCtx();

  expect(() => ctx.throw(400)).toThrowError(HttpError);
});

test('set body only', () => {
  const ctx = createCtx();

  ctx.send({ hello: 'world' });

  expect(ctx.response.body).toStrictEqual({ hello: 'world' });
  expect(ctx.response.status).toBe(200);
});

test('set status only', () => {
  const ctx = createCtx();

  ctx.send(201);
  expect(ctx.response.body).toBeNull();
  expect(ctx.response.status).toBe(201);
});

test('set status only with body===undefined', () => {
  const ctx = createCtx();

  ctx.send(201, undefined);
  expect(ctx.response.body).toBeNull();
  expect(ctx.response.status).toBe(201);
});

test('set status and body', () => {
  const ctx = createCtx();

  ctx.send(201, { hello: 'world' });
  expect(ctx.response.body).toStrictEqual({ hello: 'world' });
  expect(ctx.response.status).toBe(201);
});

test('set body with different type', () => {
  const ctx = createCtx();
  ctx.send(200, {});
  ctx.send(200, []);
  ctx.send(200, 'x');
  ctx.send(200, null);
  ctx.send(200, Buffer.from([]));
  ctx.send(200, new Stream());

  // @ts-expect-error
  ctx.send(200, 2);
  // @ts-expect-error
  ctx.send(200, true);
});

describe('cookies', () => {
  test('get cookie from request', async () => {
    const app = new WebApp({
      routers: [],
      globalSlots: manageSlots('web').load(
        createSlot('web', (ctx) => {
          ctx.send(String(ctx.cookies.get('x')));
        }),
      ),
    });

    await supertest(app.listen()).get('/').expect('undefined');
    await supertest(app.listen())
      .get('/')
      .set('Cookie', ['x=abcd', 'y=aabbcc'])
      .expect('abcd');
    await supertest(app.listen())
      .get('/')
      .set('Cookie', ['y=aabbcc'])
      .expect('undefined');
  });

  test.todo('set cookie to response');

  test.todo('delete cookie from response');

  test.todo('set cookie with options');

  test.todo('delete cookie with options');
});
