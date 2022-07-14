import { WebApp, manageSlots, createSlot } from '@husca/husca';
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import { prettyJson } from '../src';
import { Readable } from 'stream';

describe('pretty', () => {
  test('should default to true', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson())
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen()).get('/').expect('{\n  "foo": "bar"\n}');
  });

  test('should ok', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson())
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: null, bar: undefined });
          }),
        ),
    });

    await request(app.listen()).get('/').expect('{\n  "foo": null\n}');
  });

  test('should retain content-type', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson())
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen())
      .get('/')
      .expect('Content-Type', /application\/json/);
  });

  test('should pass through when false', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson({ pretty: false }))
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen()).get('/').expect('{"foo":"bar"}');
  });

  test('should allow custom spaces', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson({ pretty: true, spaces: 4 }))
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen()).get('/').expect('{\n    "foo": "bar"\n}');
  });
});

describe('streams', () => {
  test('should not do anything binary streams', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson())
        .load(
          createSlot((ctx) => {
            const stream = new Readable();
            ctx.send(stream);
            stream.push('lol');
            stream.push(null);
          }),
        ),
    });

    await request(app.listen())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.toString()).toBe('lol');
      });
  });

  test('should always stringify object streams', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(
          prettyJson({
            pretty: false,
          }),
        )
        .load(
          createSlot((ctx) => {
            const stream = new Readable({ objectMode: true });
            ctx.send(stream);
            stream.push({
              message: '1',
            });
            stream.push({
              message: '2',
            });
            stream.push(null);
          }),
        ),
    });

    await request(app.listen())
      .get('/')
      .expect('Content-Type', /application\/json/)
      .expect(200, [
        {
          message: '1',
        },
        {
          message: '2',
        },
      ])
      .expect((res) => {
        expect(res.text).toContain('{"message":"1"}');
        expect(res.text).toContain('{"message":"2"}');
      });
  });

  test('should prettify object streams', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson())
        .load(
          createSlot((ctx) => {
            const stream = new Readable({ objectMode: true });
            ctx.send(stream);
            stream.push({
              message: '1',
            });
            stream.push({
              message: '2',
            });
            stream.push(null);
          }),
        ),
    });

    await request(app.listen())
      .get('/')
      .expect('Content-Type', /application\/json/)
      .expect(200, [
        {
          message: '1',
        },
        {
          message: '2',
        },
      ])
      .expect((res) => {
        expect(res.text).toContain('{\n  "message": "1"\n}');
        expect(res.text).toContain('{\n  "message": "2"\n}');
      });
  });
});

describe('param', () => {
  test('should default to being disabled', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson({ pretty: false }))
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen()).get('/?pretty').expect('{"foo":"bar"}');
  });

  test('should pretty-print when present', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(prettyJson({ pretty: false, param: 'pretty' }))
        .load(
          createSlot((ctx) => {
            ctx.send({ foo: 'bar' });
          }),
        ),
    });

    await request(app.listen()).get('/?pretty').expect('{\n  "foo": "bar"\n}');
  });
});
