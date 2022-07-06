import {
  createSlot,
  manageSlots,
  WebApp,
  WebCtx,
  WebSlotManager,
} from '@husca/husca';
import { assert, describe, test } from 'vitest';
import request from 'supertest';
import { cors, CorsOptions } from '../src';

const createApp = (
  options?: CorsOptions,
  callback?: (ctx: WebCtx) => {},
  prevSlotManager?: WebSlotManager,
) => {
  return new WebApp({
    routers: [],
    globalSlots: manageSlots('web')
      .load(prevSlotManager || null)
      .load(cors(options))
      .load(
        createSlot('web', (ctx) => {
          ctx.send({ foo: 'bar' });
          callback?.(ctx);
        }),
      ),
  });
};

describe('default options', function () {
  const app = createApp();

  test('should not set `Access-Control-Allow-Origin` when request Origin header missing', (done) => {
    request(app.listen())
      .get('/')
      .expect({ foo: 'bar' })
      .expect(200, function (err, res) {
        assert(!err);
        assert(!res.headers['access-control-allow-origin']);
        done();
      });
  });

  test('should set `Access-Control-Allow-Origin` to request origin header', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should 204 on Preflight Request', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Allow-Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH')
      .expect(204, done);
  });

  test('should not Preflight Request if request missing Access-Control-Request-Method', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .expect(200, done);
  });

  test('should always set `Vary` to Origin', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Vary', 'Origin')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });
});

describe('options.origin=*', function () {
  const app = createApp({
    origin: '*',
  });

  test('should always set `Access-Control-Allow-Origin` to *', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Origin', '*')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });
});

describe('options.secureContext=true', function () {
  const app = new WebApp({
    routers: [],
    globalSlots: manageSlots('web')
      .load(
        cors({
          secureContext: true,
        }),
      )
      .load(
        createSlot('web', (ctx) => {
          ctx.send({ foo: 'bar' });
        }),
      ),
  });

  test('should always set `Cross-Origin-Opener-Policy` & `Cross-Origin-Embedder-Policy` on not OPTIONS', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Cross-Origin-Opener-Policy', 'same-origin')
      .expect('Cross-Origin-Embedder-Policy', 'require-corp')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should always set `Cross-Origin-Opener-Policy` & `Cross-Origin-Embedder-Policy` on OPTIONS', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Cross-Origin-Opener-Policy', 'same-origin')
      .expect('Cross-Origin-Embedder-Policy', 'require-corp')
      .expect(204, done);
  });
});

describe('options.secureContext=false', function () {
  const app = createApp({
    secureContext: false,
  });

  test('should not set `Cross-Origin-Opener-Policy` & `Cross-Origin-Embedder-Policy`', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect((res) => {
        assert(!('Cross-Origin-Opener-Policy' in res.headers));
        assert(!('Cross-Origin-Embedder-Policy' in res.headers));
      })
      .expect({ foo: 'bar' })
      .expect(200, done);
  });
});

describe('options.origin=function', function () {
  const app = createApp({
    origin: (ctx) => (ctx.request.url === '/forbin' ? '' : '*'),
  });

  test('should disable cors', function (done) {
    request(app.listen())
      .get('/forbin')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200, function (err, res) {
        assert(!err);
        assert(!res.headers['access-control-allow-origin']);
        done();
      });
  });

  test('should set access-control-allow-origin to *', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, done);
  });
});

describe('options.origin=async function', function () {
  const app = createApp({
    origin: async (ctx) => (ctx.request.url === '/forbin' ? '' : '*'),
  });

  test('should disable cors', function (done) {
    request(app.listen())
      .get('/forbin')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200, function (err, res) {
        assert(!err);
        assert(!res.headers['access-control-allow-origin']);
        done();
      });
  });

  test('should set access-control-allow-origin to *', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect('Access-Control-Allow-Origin', '*')
      .expect(200, done);
  });
});

describe('options.exposeHeaders', function () {
  test('should Access-Control-Expose-Headers: `content-length`', function (done) {
    const app = createApp({
      exposeHeaders: 'content-length',
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Expose-Headers', 'content-length')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should work with array', function (done) {
    const app = createApp({
      exposeHeaders: ['content-length', 'x-header'],
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Expose-Headers', 'content-length,x-header')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });
});

describe('options.maxAge', function () {
  test('should set maxAge with number', function (done) {
    const app = createApp({
      maxAge: 3600,
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Max-Age', '3600')
      .expect(204, done);
  });

  test('should set maxAge with string', function (done) {
    const app = createApp({
      maxAge: '3600',
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Max-Age', '3600')
      .expect(204, done);
  });

  test('should not set maxAge on simple request', function (done) {
    const app = createApp({
      maxAge: '3600',
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200, function (err, res) {
        assert(!err);
        assert(!res.headers['access-control-max-age']);
        done();
      });
  });
});

describe('options.credentials', function () {
  const app = createApp({
    credentials: true,
  });

  test('should enable Access-Control-Allow-Credentials on Simple request', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should enable Access-Control-Allow-Credentials on Preflight request', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(204, done);
  });
});

describe('options.credentials unset', function () {
  const app = createApp();

  test('should disable Access-Control-Allow-Credentials on Simple request', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200)
      .end(function (error, response) {
        if (error) return done(error);

        const header = response.headers['access-control-allow-credentials'];
        assert.equal(
          header,
          undefined,
          'Access-Control-Allow-Credentials must not be set.',
        );
        done();
      });
  });

  test('should disable Access-Control-Allow-Credentials on Preflight request', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .expect(204)
      .end(function (error, response) {
        if (error) return done(error);

        const header = response.headers['access-control-allow-credentials'];
        assert.equal(
          header,
          undefined,
          'Access-Control-Allow-Credentials must not be set.',
        );
        done();
      });
  });
});

describe('options.credentials=function', function () {
  const app = createApp({
    credentials(ctx) {
      return ctx.request.url !== '/forbin';
    },
  });

  test('should enable Access-Control-Allow-Credentials on Simple request', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should enable Access-Control-Allow-Credentials on Preflight request', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(204, done);
  });

  test('should disable Access-Control-Allow-Credentials on Simple request', function (done) {
    request(app.listen())
      .get('/forbin')
      .set('Origin', 'http://koajs.com')
      .expect({ foo: 'bar' })
      .expect(200)
      .end(function (error, response) {
        if (error) return done(error);

        const header = response.headers['access-control-allow-credentials'];
        assert.equal(
          header,
          undefined,
          'Access-Control-Allow-Credentials must not be set.',
        );
        done();
      });
  });

  test('should disable Access-Control-Allow-Credentials on Preflight request', function (done) {
    request(app.listen())
      .options('/forbin')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .expect(204)
      .end(function (error, response) {
        if (error) return done(error);

        const header = response.headers['access-control-allow-credentials'];
        assert.equal(
          header,
          undefined,
          'Access-Control-Allow-Credentials must not be set.',
        );
        done();
      });
  });
});

describe('options.credentials=async function', function () {
  const app = createApp({
    credentials: async () => true,
  });

  test('should enable Access-Control-Allow-Credentials on Simple request', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });

  test('should enable Access-Control-Allow-Credentials on Preflight request', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'DELETE')
      .expect('Access-Control-Allow-Credentials', 'true')
      .expect(204, done);
  });
});

describe('options.allowHeaders', function () {
  test('should work with allowHeaders is string', function (done) {
    const app = createApp({
      allowHeaders: 'X-PINGOTHER',
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Allow-Headers', 'X-PINGOTHER')
      .expect(204, done);
  });

  test('should work with allowHeaders is array', function (done) {
    const app = createApp({
      allowHeaders: ['X-PINGOTHER'],
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Allow-Headers', 'X-PINGOTHER')
      .expect(204, done);
  });

  test('should set Access-Control-Allow-Headers to request access-control-request-headers header', function (done) {
    const app = createApp();

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .set('access-control-request-headers', 'X-PINGOTHER')
      .expect('Access-Control-Allow-Headers', 'X-PINGOTHER')
      .expect(204, done);
  });
});

describe('options.allowMethods', function () {
  test('should work with allowMethods is array', function (done) {
    const app = createApp({
      allowMethods: ['GET', 'POST'],
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Allow-Methods', 'GET,POST')
      .expect(204, done);
  });

  test('should skip allowMethods', function (done) {
    const app = createApp({
      allowMethods: undefined,
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect(204, done);
  });
});

describe('options.headersKeptOnError', function () {
  test('should keep CORS headers after an error', function (done) {
    const app = createApp({}, () => {
      throw new Error('Whoops!');
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Origin', 'http://koajs.com')
      .expect('Vary', 'Origin')
      .expect(/Error/)
      .expect(500, done);
  });

  test('should not affect OPTIONS requests', function (done) {
    const app = createApp({}, () => {
      throw new Error('Whoops!');
    });

    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect('Access-Control-Allow-Origin', 'http://koajs.com')
      .expect(204, done);
  });

  test('should not keep unrelated headers', function (done) {
    const app = createApp({}, (ctx) => {
      ctx.response.setHeader('X-Example', 'Value');
      throw new Error('Whoops!');
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Access-Control-Allow-Origin', 'http://koajs.com')
      .expect(/Error/)
      .expect(500, function (err, res) {
        if (err) {
          return done(err);
        }
        assert(!res.headers['x-example']);
        done();
      });
  });

  test('should not keep CORS headers after an error if keepHeadersOnError is false', function (done) {
    const app = createApp({ keepHeadersOnError: false }, () => {
      throw new Error('Whoops!');
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect(/Error/)
      .expect(500, function (err, res) {
        if (err) {
          return done(err);
        }
        assert(!res.headers['access-control-allow-origin']);
        assert(!res.headers.vary);
        done();
      });
  });
});

describe('other middleware has been set `Vary` header to Accept-Encoding', function () {
  const app = createApp(
    {},
    undefined,
    manageSlots('web').load(
      createSlot('web', (ctx, next) => {
        ctx.response.setHeader('Vary', 'Accept-Encoding');
        return next();
      }),
    ),
  );

  test('should append `Vary` header to Origin', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Vary', 'Accept-Encoding, Origin')
      .expect({ foo: 'bar' })
      .expect(200, done);
  });
});
describe('other middleware has set vary header on Error', function () {
  test('should append `Origin to other `Vary` header', function (done) {
    const app = createApp({}, () => {
      const error = new Error('Whoops!');
      // @ts-ignore
      error.headers = { Vary: 'Accept-Encoding' };
      throw error;
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Vary', 'Accept-Encoding, Origin')
      .expect(/Error/)
      .expect(500, done);
  });
  test('should preserve `Vary: *`', function (done) {
    const app = createApp({}, () => {
      const error = new Error('Whoops!');
      // @ts-ignore
      error.headers = { Vary: '*' };
      throw error;
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Vary', '*')
      .expect(/Error/)
      .expect(500, done);
  });
  test('should not append Origin` if already present in `Vary`', function (done) {
    const app = createApp({}, () => {
      const error = new Error('Whoops!');
      // @ts-ignore
      error.headers = { Vary: 'Origin, Accept-Encoding' };
      throw error;
    });

    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .expect('Vary', 'Origin, Accept-Encoding')
      .expect(/Error/)
      .expect(500, done);
  });
});

describe('options.privateNetworkAccess=false', function () {
  const app = createApp({ privateNetworkAccess: false });

  test('should not set `Access-Control-Allow-Private-Network` on not OPTIONS', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect((res) => {
        assert(!('Access-Control-Allow-Private-Network' in res.headers));
      })
      .expect(200, done);
  });

  test('should not set `Access-Control-Allow-Private-Network` if `Access-Control-Request-Private-Network` not exist on OPTIONS', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect((res) => {
        assert(!('Access-Control-Allow-Private-Network' in res.headers));
      })
      .expect(204, done);
  });

  test('should not set `Access-Control-Allow-Private-Network` if `Access-Control-Request-Private-Network` exist on OPTIONS', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .set('Access-Control-Request-Private-Network', 'true')
      .expect((res) => {
        assert(!('Access-Control-Allow-Private-Network' in res.headers));
      })
      .expect(204, done);
  });
});

describe('options.privateNetworkAccess=true', function () {
  const app = createApp({ privateNetworkAccess: true });

  test('should not set `Access-Control-Allow-Private-Network` on not OPTIONS', function (done) {
    request(app.listen())
      .get('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect((res) => {
        assert(!('Access-Control-Allow-Private-Network' in res.headers));
      })
      .expect(200, done);
  });

  test('should not set `Access-Control-Allow-Private-Network` if `Access-Control-Request-Private-Network` not exist on OPTIONS', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .expect((res) => {
        assert(!('Access-Control-Allow-Private-Network' in res.headers));
      })
      .expect(204, done);
  });

  test('should always set `Access-Control-Allow-Private-Network` if `Access-Control-Request-Private-Network` exist on OPTIONS', function (done) {
    request(app.listen())
      .options('/')
      .set('Origin', 'http://koajs.com')
      .set('Access-Control-Request-Method', 'PUT')
      .set('Access-Control-Request-Private-Network', 'true')
      .expect('Access-Control-Allow-Private-Network', 'true')
      .expect(204, done);
  });
});
