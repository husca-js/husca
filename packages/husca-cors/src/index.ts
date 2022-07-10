import { WebCtx, HttpError, createSlot } from '@husca/husca';
import vary from 'vary';

export interface CorsOptions {
  /**
   * `Access-Control-Allow-Origin`, default is request Origin header.
   *
   * @remarks
   * If a function is provided, it will be called for each request with
   * the koa context object. It may return a string or a promise that
   * will resolve with a string.
   */
  origin?:
    | ((ctx: WebCtx) => string)
    | ((ctx: WebCtx) => PromiseLike<string>)
    | string;

  /**
   * `Access-Control-Allow-Methods`, default is
   * 'GET,HEAD,PUT,POST,DELETE,PATCH'
   */
  allowMethods?: string[] | string;

  /**
   * `Access-Control-Expose-Headers`
   */
  exposeHeaders?: string[] | string;

  /**
   * `Access-Control-Allow-Headers`
   */
  allowHeaders?: string[] | string;

  /**
   * `Access-Control-Max-Age` in seconds
   */
  maxAge?: number | string;

  /**
   * `Access-Control-Allow-Credentials`
   *
   * @remarks
   * If a function is provided, it will be called for each request with
   * the koa context object. It may return a boolean or a promise that
   * will resolve with a boolean.
   */
  credentials?:
    | ((ctx: WebCtx) => boolean)
    | ((ctx: WebCtx) => PromiseLike<boolean>)
    | boolean;

  /**
   * Add set headers to `err.header` if an error is thrown
   */
  keepHeadersOnError?: boolean;

  /**
   * Add `Cross-Origin-Opener-Policy` & `Cross-Origin-Embedder-Policy` to response headers
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer/Planned_changes
   */
  secureContext?: boolean;

  /**
   * Handle `Access-Control-Request-Private-Network` request by return `Access-Control-Allow-Private-Network`
   *
   * @see https://wicg.github.io/private-network-access/
   */
  privateNetworkAccess?: boolean;
}

const defaults: CorsOptions = {
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  secureContext: false,
};

export const cors = (options: CorsOptions = {}) => {
  options = {
    ...defaults,
    ...options,
  };

  (<const>['exposeHeaders', 'allowMethods', 'allowHeaders']).forEach((key) => {
    const value = options[key];
    if (Array.isArray(value)) {
      options[key] = value.join(',');
    }
  });

  if (options.maxAge) {
    options.maxAge = String(options.maxAge);
  }

  options.keepHeadersOnError = options.keepHeadersOnError !== false;

  return createSlot('web', async (ctx, next) => {
    const { request, response } = ctx;
    // If the Origin header is not present terminate this set of steps.
    // The request is outside the scope of this specification.
    const requestOrigin = request.headers['origin'];

    // Always set Vary header
    // https://github.com/rs/cors/issues/10
    vary(response, 'Origin');

    if (!requestOrigin) return next();

    let origin: string;
    if (typeof options.origin === 'function') {
      origin = await options.origin(ctx);
      if (!origin) return next();
    } else {
      origin = options.origin || requestOrigin;
    }

    let credentials;
    if (typeof options.credentials === 'function') {
      credentials = await options.credentials(ctx);
    } else {
      credentials = !!options.credentials;
    }

    const headersSet: Record<string, any> = {};

    function setAndRecordHeader(key: string, value: any) {
      response.setHeader(key, value);
      headersSet[key] = value;
    }

    if (request.method !== 'OPTIONS') {
      // Simple Cross-Origin Request, Actual Request, and Redirects
      setAndRecordHeader('Access-Control-Allow-Origin', origin);

      credentials &&
        setAndRecordHeader('Access-Control-Allow-Credentials', 'true');

      if (options.exposeHeaders) {
        setAndRecordHeader(
          'Access-Control-Expose-Headers',
          options.exposeHeaders,
        );
      }

      if (options.secureContext) {
        setAndRecordHeader('Cross-Origin-Opener-Policy', 'same-origin');
        setAndRecordHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      }

      if (!options.keepHeadersOnError) {
        return next();
      }

      return next().catch((err: HttpError) => {
        const errHeadersSet = err.headers || {};
        const varyWithOrigin = vary.append(
          errHeadersSet.vary || errHeadersSet.Vary || '',
          'Origin',
        );
        delete errHeadersSet.Vary;

        err.headers = {
          ...errHeadersSet,
          ...headersSet,
          ...{ vary: varyWithOrigin },
        };

        return Promise.reject(err);
      });
    } else {
      // Preflight Request

      // If there is no Access-Control-Request-Method header or if parsing failed,
      // do not set any additional headers and terminate this set of steps.
      // The request is outside the scope of this specification.
      if (!request.headers['access-control-request-method']) {
        // this not preflight request, ignore it
        return next();
      }

      response.setHeader('Access-Control-Allow-Origin', origin);

      if (credentials === true) {
        response.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      if (options.maxAge) {
        response.setHeader('Access-Control-Max-Age', options.maxAge);
      }

      if (
        options.privateNetworkAccess &&
        request.headers['access-control-request-private-network']
      ) {
        response.setHeader('Access-Control-Allow-Private-Network', 'true');
      }

      if (options.allowMethods) {
        response.setHeader(
          'Access-Control-Allow-Methods',
          options.allowMethods,
        );
      }

      if (options.secureContext) {
        setAndRecordHeader('Cross-Origin-Opener-Policy', 'same-origin');
        setAndRecordHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      }

      const allowHeaders =
        options.allowHeaders ||
        request.headers['access-control-request-headers'];

      if (allowHeaders) {
        response.setHeader('Access-Control-Allow-Headers', allowHeaders);
      }

      ctx.send(204);
    }
  });
};
