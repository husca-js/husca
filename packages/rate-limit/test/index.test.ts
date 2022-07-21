import {
  createSlot,
  HttpError,
  manageSlots,
  MemoryCache,
  WebApp,
} from '@husca/husca';
import sleep from 'sleep-promise';
import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { rateLimit } from '../src';

const duration = 1000;
const goodBody = 'Num times hit:';

const db = new MemoryCache();

beforeEach(async () => {
  await db.deleteAll();
});

describe('limit', () => {
  let guard: number;
  let app: WebApp;

  const hitOnce = () => expect(guard).toBe(1);

  beforeEach(async () => {
    app = new WebApp({
      globalSlots: manageSlots()
        .load(rateLimit({ driver: db, duration, max: 1 }))
        .load(
          createSlot(async (ctx) => {
            guard++;
            ctx.send(`${goodBody} ${guard}`);
          }),
        ),
    });

    guard = 0;

    await sleep(duration);
    await request(app.listen())
      .get('/')
      .expect(200, `${goodBody} 1`)
      .expect(hitOnce);
  });

  test('responds with 429 when rate limit is exceeded', async () => {
    await request(app.listen())
      .get('/')
      .expect('X-RateLimit-Remaining', '0')
      .expect(429);
  });

  test('responds with 429 when rate limit is exceeded and remaining is 0', async () => {
    await request(app.listen()).get('/');

    await request(app.listen())
      .get('/')
      .expect('X-RateLimit-Remaining', '0')
      .expect(429);
  });

  test('should not yield downstream if ratelimit is exceeded', async () => {
    await request(app.listen()).get('/').expect(429);

    hitOnce();
  });
});

describe('limit with throw', () => {
  let guard: number;
  let app: WebApp;

  const hitOnce = () => expect(guard).toBe(1);

  beforeEach(async () => {
    app = new WebApp({
      globalSlots: manageSlots()
        .load(
          createSlot(async (ctx, next) => {
            try {
              await next();
            } catch (e) {
              ctx.send((e as HttpError).message);
              ctx.response.setHeaders(
                Object.assign(
                  { 'X-Custom': 'foobar' },
                  (e as HttpError).headers,
                ),
              );
            }
          }),
        )
        .load(
          rateLimit({
            driver: db,
            duration,
            max: 1,
            throw: true,
          }),
        )
        .load(
          createSlot(async (ctx) => {
            guard++;
            ctx.send(`${goodBody} ${guard}`);
          }),
        ),
    });

    guard = 0;

    await sleep(duration);
    await request(app.listen())
      .get('/')
      .expect(200, `${goodBody} 1`)
      .expect(hitOnce);
  });

  test('responds with 429 when rate limit is exceeded', async () => {
    await request(app.listen())
      .get('/')
      .expect('X-Custom', 'foobar')
      .expect('X-RateLimit-Remaining', '0')
      .expect(429)
      .expect((res) => {
        expect(res.text).toMatch(/^Rate limit exceeded, retry in.*/);
      });
  });
});

describe('id', async () => {
  test('should allow specifying a custom `id` function', async () => {
    const app = new WebApp({
      globalSlots: manageSlots().load(
        rateLimit({
          driver: db,
          id: (ctx) => ctx.request.headers.foo as string,
          max: 1,
        }),
      ),
    });

    await request(app.listen())
      .get('/')
      .set('foo', 'bar')
      .expect('X-RateLimit-Remaining', '0');
  });

  test('should not limit if `id` returns `false`', async () => {
    const app = new WebApp({
      globalSlots: manageSlots().load(
        rateLimit({ driver: db, id: () => false, max: 5 }),
      ),
    });

    await request(app.listen())
      .get('/')
      .expect((res) => {
        expect(res.header).not.haveOwnProperty('x-ratelimit-remaining');
      });
  });

  test('should limit using the `id` value', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(
          rateLimit({
            driver: db,
            id: (ctx) => ctx.request.headers.foo as string,
            max: 1,
          }),
        )
        .load(
          createSlot((ctx) => {
            ctx.send(ctx.request.headers.foo ?? null);
          }),
        ),
    });

    await request(app.listen()).get('/').set('foo', 'fiz').expect(200, 'fiz');

    await request(app.listen()).get('/').set('foo', 'biz').expect(200, 'biz');
  });
});

describe('whitelist', () => {
  const duration = 1000;
  let guard: number;
  let app: WebApp;

  const hitOnce = () => expect(guard).toBe(1);

  beforeEach(async () => {
    app = new WebApp({
      globalSlots: manageSlots()
        .load(
          rateLimit({
            driver: db,
            allowList: (ctx) => ctx.request.headers.foo === 'whitelistme',
            max: 1,
          }),
        )
        .load(
          createSlot((ctx) => {
            guard++;
            ctx.send('foo');
          }),
        ),
    });

    guard = 0;

    await sleep(duration);
    await request(app.listen()).get('/').expect(200).expect(hitOnce);
  });

  test('should not limit if satisfy whitelist function', async () => {
    await request(app.listen()).get('/').set('foo', 'whitelistme').expect(200);

    await request(app.listen()).get('/').set('foo', 'whitelistme').expect(200);
  });

  test('should limit as usual if not whitelist return false', async () => {
    await request(app.listen())
      .get('/')
      .set('foo', 'imnotwhitelisted')
      .expect(429);
  });
});

describe('blacklist', () => {
  let app: WebApp;

  beforeEach(async () => {
    app = new WebApp({
      globalSlots: manageSlots()
        .load(
          rateLimit({
            driver: db,
            denyList: (ctx) => ctx.request.headers.foo === 'blacklisted',
            max: 1,
          }),
        )
        .load(
          createSlot((ctx) => {
            ctx.send('foo');
          }),
        ),
    });
  });

  test('should throw 403 if blacklisted', async () => {
    await request(app.listen()).get('/').set('foo', 'blacklisted').expect(403);
  });

  test('should return 200 when not blacklisted', async () => {
    await request(app.listen())
      .get('/')
      .set('foo', 'imnotblacklisted')
      .expect(200);
  });
});

describe('custom headers', () => {
  test('should allow specifying custom header names', async () => {
    const app = new WebApp({
      globalSlots: manageSlots().load(
        rateLimit({
          driver: db,
          headers: {
            remaining: 'Rate-Limit-Remaining',
            reset: 'Rate-Limit-Reset',
            total: 'Rate-Limit-Total',
          },
          max: 1,
        }),
      ),
    });

    await request(app.listen())
      .get('/')
      .set('foo', 'bar')
      .expect((res) => {
        expect(res.headers).toHaveProperty('rate-limit-remaining');
        expect(res.headers).toHaveProperty('rate-limit-reset');
        expect(res.headers).toHaveProperty('rate-limit-total');

        expect(res.headers).not.to.keys(
          'x-ratelimit-limit',
          'x-ratelimit-remaining',
          'x-ratelimit-reset',
        );
      });
  });
});

describe('custom error message', async () => {
  test('should allow specifying a custom error message', async () => {
    const errorMessage = 'Sometimes You Just Have to Slow Down.';
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(
          rateLimit({
            driver: db,
            errorMessage,
            max: 1,
          }),
        )
        .load(
          createSlot((ctx) => {
            ctx.send('foo');
          }),
        ),
    });

    await request(app.listen()).get('/').expect(200);
    await request(app.listen()).get('/').expect(429).expect(errorMessage);
  });

  test('should return default error message when not specifying', async () => {
    const app = new WebApp({
      globalSlots: manageSlots()
        .load(
          rateLimit({
            driver: db,
            max: 1,
          }),
        )
        .load(
          createSlot((ctx) => {
            ctx.send('foo');
          }),
        ),
    });

    await request(app.listen()).get('/').expect(200);

    await request(app.listen())
      .get('/')
      .set('foo', 'bar')
      .expect(429)
      .expect((res) => {
        expect(res.text).to.match(
          /Rate limit exceeded, retry in \d+ minutes\./,
        );
      });
  });
});

describe('disable headers', () => {
  test('should disable headers when set opts.disableHeader', async () => {
    const app = new WebApp({
      globalSlots: manageSlots().load(
        rateLimit({
          driver: db,
          headers: {
            remaining: 'Rate-Limit-Remaining',
            reset: 'Rate-Limit-Reset',
            total: 'Rate-Limit-Total',
          },
          disableHeader: true,
          max: 1,
        }),
      ),
    });

    await request(app.listen())
      .get('/')
      .set('foo', 'bar')
      .expect((res) => {
        expect(res.headers).not.to.keys(
          'rate-limit-remaining',
          'rate-limit-reset',
          'rate-limit-total',
        );
        expect(res.headers).not.to.keys(
          'x-ratelimit-limit',
          'x-ratelimit-remaining',
          'x-ratelimit-reset',
        );
      });
  });
});
