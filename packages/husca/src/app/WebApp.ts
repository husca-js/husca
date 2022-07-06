import util from 'node:util';
import http from 'node:http';
import stream from 'node:stream';
import qs from 'qs';
import cookies from 'cookies';
import { HttpError } from 'http-errors';
import { App } from './App';
import { WebContext } from './WebContext';
import { WebRequest } from './WebRequest';
import { WebResponse } from './WebResponse';
import { Router, RouterParser } from '../router';
import { WebSlotManager } from '../slot';
import { composeToMiddleware } from '../utils/compose';

export interface WebAppOptions {
  readonly routers: string[];
  readonly proxy?: boolean | string;
  readonly globalSlots?: WebSlotManager;
  readonly querystring?: qs.IParseOptions;
  readonly cookies?: cookies.Option;
}

export class WebApp extends App {
  public readonly proxy: false | string;
  public readonly qsParseOptions?: qs.IParseOptions;
  public readonly cookieOptions?: cookies.Option;

  constructor(options: WebAppOptions) {
    super({ globSlots: options.globalSlots, paths: options.routers });

    this.qsParseOptions = options.querystring;
    this.cookieOptions = options.cookies;

    switch (options.proxy) {
      case true:
        this.proxy = 'X-Forwarded-For';
        break;
      case false:
      case void 0:
        this.proxy = false;
        break;
      default:
        this.proxy = options.proxy;
    }
  }

  public declare mountRouter: (routers: Router | Router[]) => void;

  public readonly listen: http.Server['listen'] = (...args: any[]) => {
    return http
      .createServer(
        {
          IncomingMessage: WebRequest,
          ServerResponse: WebResponse,
        },
        this.callback(),
      )
      .listen(...args);
  };

  protected callback(): http.RequestListener {
    const fn = composeToMiddleware(this.middleware);

    if (!this.listenerCount('error')) {
      this.on('error', this.log);
    }

    return (_req, _res) => {
      const request = _req as WebRequest;
      const response = _res as WebResponse;
      const ctx = new WebContext(this, request, response);

      const handleResponse = () => WebResponse.respondOK(response);
      const handleError = (err?: Error | null) =>
        WebResponse.respondError(response, err);

      response.statusCode = 404;
      stream.finished(response, handleError);

      return fn(ctx).then(handleResponse).catch(handleError);
    };
  }

  public log(err: HttpError) {
    if (!(err instanceof Error)) {
      throw new TypeError(util.format('non-error thrown: %j', err));
    }

    if ((this.silent || err.status || err.statusCode) === 404 || err.expose)
      return;

    const msg = err.stack || err.toString();
    console.error(`\n${msg.replace(/^/gm, '  ')}\n`);
  }

  protected createRouterParser(): RouterParser {
    return new RouterParser(this.preSlotID, this.routerSlots);
  }
}
