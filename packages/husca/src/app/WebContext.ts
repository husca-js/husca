import createHttpError from 'http-errors';
import { WebRequest } from './WebRequest';
import Cookies from 'cookies';
import { Body, WebResponse } from './WebResponse';
import { WebApp } from './WebApp';

export type WebCtx<Props extends object = object> = WebContext & Props;

export interface CookieHelper {
  get(key: string, opts?: Cookies.GetOption): string | undefined;
  set(key: string, value: string, opts?: Cookies.SetOption): this;
  delete(key: string, opts?: Cookies.SetOption): this;
}

export class WebContext {
  protected _cookie?: CookieHelper;

  constructor(
    public readonly app: WebApp,
    public readonly request: WebRequest,
    public readonly response: WebResponse,
  ) {
    request.app = response.app = app;
    request.res = response;
  }

  /**
   * Throw an error with `msg` and optional `status`
   * defaulting to 500. Note that these are user-level
   * errors, and the message may be exposed to the client.
   * ```typescript
   *    this.throw(403)
   *    this.throw('name required', 400)
   *    this.throw(400, 'name required')
   *    this.throw('something exploded')
   *    this.throw(new Error('invalid'), 400);
   *    this.throw(400, new Error('invalid'));
   * ```
   * @link https://github.com/jshttp/http-errors
   *
   */
  throw(statusCode: number, message?: string | Error, properties?: {}): never;
  throw(message: string | Error, statusCode?: number, properties?: {}): never;
  throw(arg: any, ...properties: Array<number | string | {}>): never;
  throw(arg: any, ...args: any[]): never {
    throw createHttpError(arg, ...args);
  }

  send(statusCode: number, body?: Body): this;
  send(body: Body): this;
  send(statusOrBody: number | Body, body?: Body): this {
    if (typeof statusOrBody === 'number') {
      this.response.statusCode = statusOrBody;
    } else {
      body = statusOrBody;
    }

    this.response.body = body;

    return this;
  }

  get cookies(): CookieHelper {
    if (!this._cookie) {
      const cookie = new Cookies(
        this.request,
        this.response,
        this.app.cookieOptions,
      );

      this._cookie = {
        get(key, options) {
          return cookie.get(key, options);
        },
        set(key, value, options) {
          cookie.set(key, value, options);
          return this;
        },
        delete(key, options) {
          cookie.set(key, null, options);
          return this;
        },
      };
    }

    return this._cookie;
  }
}
