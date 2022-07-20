import { IncomingMessage } from 'node:http';
import parseurl from 'parseurl';
import formidable from 'formidable';
import coBody from 'co-body';
import accepts, { Accepts } from 'accepts';
import contentType from 'content-type';
import typeIs from 'type-is';
import fresh from 'fresh';
import qs from 'qs';
import type { WebApp } from './WebApp';
import type { WebResponse } from './WebResponse';
import { WebContext } from './WebContext';

export class WebRequest extends IncomingMessage {
  public app!: WebApp;
  public ctx!: WebContext;
  public res!: WebResponse;

  declare readonly method: string;

  public params: Record<string, unknown> = {};
  protected _accept?: Accepts;
  protected _body?: any;
  protected _query?: any;

  get pathname(): string {
    return parseurl(this)!.pathname!;
  }

  public get query(): Record<string, unknown> {
    return (this._query ||= qs.parse(
      this.querystring,
      this.app.qsParseOptions,
    ));
  }

  get querystring(): string {
    return (parseurl(this)!.query as string) || '';
  }

  get ips(): string[] {
    const proxy = this.app.proxy;

    if (!proxy) return [];

    const val = this.headers[proxy];
    let ips = val ? val.toString().split(/\s*,\s*/) : [];
    if (this.app.maxIpsCount > 0) {
      ips = ips.slice(-this.app.maxIpsCount);
    }
    return ips;
  }

  get ip(): string {
    return this.ips[0] || this.socket.remoteAddress || '';
  }

  public get body(): unknown {
    if (this._body !== undefined) return this._body;

    if (this.matchContentType('multipart/*')) {
      const form = formidable({
        hashAlgorithm: 'md5',
        keepExtensions: true,
        maxFileSize: 1000 * 1024 * 1024,
        allowEmptyFiles: true,
      });

      return (this._body = new Promise((resolve, reject) => {
        form.parse(this, (err, fields, files) => {
          if (err) return reject(err);

          resolve(
            (this._body = {
              ...fields,
              ...files,
            }),
          );
        });
      }));
    }

    return (this._body = coBody(this, {
      returnRawBody: false,
    }));
  }

  get host(): string {
    let host = this.app.proxy && this.headers[this.app.proxy];

    if (!host) {
      if (this.httpVersionMajor >= 2) {
        host = this.headers[':authority'];
      }
      host ||= this.headers['host'];
    }

    host &&= host.toString().split(/\s*,\s*/, 1)[0];

    return host || '';
  }

  get charset(): string {
    try {
      const { parameters } = contentType.parse(this);
      return parameters.charset || '';
    } catch {
      return '';
    }
  }

  get contentType(): string {
    try {
      return contentType.parse(this).type;
    } catch {
      return '';
    }
  }

  get protocol(): string {
    // @ts-expect-error
    if (this.socket.encrypted) return 'https';
    if (!this.app.proxy) return 'http';

    let proto = this.headers['X-Forwarded-Proto'] as string | undefined;
    proto &&= proto.split(/\s*,\s*/, 1)[0];
    return proto || 'http';
  }

  get secure(): boolean {
    return this.protocol === 'https';
  }

  get accept(): Accepts {
    return this._accept || (this._accept = accepts(this));
  }

  get fresh(): boolean {
    const method = this.method;
    const status = this.res.statusCode;

    if (method !== 'GET' && method !== 'HEAD') return false;

    if ((status >= 200 && status < 300) || status === 304) {
      return fresh(this.headers, this.res.getHeaders());
    }

    return false;
  }

  public matchContentType(type: string, ...types: string[]) {
    return typeIs(this, type, ...types);
  }
}
