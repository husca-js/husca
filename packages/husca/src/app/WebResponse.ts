import { ServerResponse } from 'node:http';
import util from 'node:util';
import { extname } from 'node:path';
import stream, { Stream } from 'node:stream';
import assert from 'node:assert';
import typeIs from 'type-is';
import vary from 'vary';
import encodeurl from 'encodeurl';
import escapeHtml from 'escape-html';
import destroy from 'destroy';
import statuses from 'statuses';
import contentDisposition from 'content-disposition';
import { getContentType } from '../utils/getContentType';
import type { WebApp } from './WebApp';
import createHttpError, { HttpError } from 'http-errors';
import { WebContext } from './WebContext';
import { WebRequest } from './WebRequest';

export type Body = string | object | Stream | Buffer | null;

export class WebResponse extends ServerResponse {
  public respond: boolean = true;
  public app!: WebApp;
  public ctx!: WebContext;
  protected _body: Body = null;
  protected explicitStatus: boolean = false;
  protected explicitNullBody: boolean = false;

  declare req: WebRequest;

  setHeaders(headers: object): void {
    for (let [key, value] of Object.entries(headers)) {
      this.setHeader(key, value);
    }
  }

  vary(field: string) {
    vary(this, field);
  }

  redirect(status: 300 | 301 | 302 | 303 | 305 | 307 | 308, url: string) {
    this.status = status;
    this.setHeader('Location', encodeurl(url));

    if (this.req.accept.types('html')) {
      url = escapeHtml(url);
      this.contentType = 'html';
      this.body = `Redirecting to <a href="${url}">${url}</a>.`;
    } else {
      this.contentType = 'text';
      this.body = `Redirecting to ${url}.`;
    }
  }

  get bodyType() {
    const body = this._body;
    if (body === null) return 'null';
    if (typeof body === 'string') return 'string';
    if (Buffer.isBuffer(body)) return 'buffer';
    if (typeof (body as Stream).pipe === 'function') return 'stream';
    return 'json';
  }

  set body(val: Body) {
    const original = this._body;
    this._body = val;

    if (val == null) {
      const isNotEmptyStatus = statuses.empty[this.statusCode];

      if (isNotEmptyStatus && this.contentType === 'application/json') {
        this._body = 'null';
        return;
      }

      if (isNotEmptyStatus) {
        this.statusCode = 204;
      }

      if (val === null) {
        this.explicitNullBody = true;
      }

      return;
    }

    if (!this.explicitStatus) {
      this.statusCode = 200;
    }

    const shouldSetContentType = !this.hasHeader('Content-Type');

    if (typeof val === 'string') {
      this.contentLength = Buffer.byteLength(val);
      shouldSetContentType &&
        (this.contentType = /^\s*</.test(val) ? 'html' : 'text');
      return;
    }

    if (Buffer.isBuffer(val)) {
      shouldSetContentType && (this.contentType = 'bin');
      this.contentLength = val.length;
      return;
    }

    if (val instanceof Stream) {
      stream.finished(this, () => {
        destroy(val);
      });

      if (original !== val) {
        this.removeHeader('Content-Length');
        val.once('error', (err) => WebResponse.respondError(this, err));
      }

      shouldSetContentType && (this.contentType = 'bin');
      return;
    }

    this.contentLength = Buffer.byteLength(JSON.stringify(val));
    this.contentType = 'json';
  }

  get body(): Body {
    return this._body;
  }

  get contentType(): string {
    let type = this.getHeader('Content-Type') as string | undefined;
    type &&= type.split(';', 1)[0];
    return type || '';
  }

  set contentType(typeOrFilenameOrExt: string) {
    const mimeType = getContentType(typeOrFilenameOrExt);
    if (mimeType !== false) {
      this.setHeader('Content-Type', mimeType);
    } else {
      this.removeHeader('Content-Type');
    }
  }

  get contentLength(): number {
    const headerName = 'Content-Length';

    return this.hasHeader(headerName)
      ? Number.parseInt(this.getHeader(headerName) as string, 10) || 0
      : this.getContentLengthByBody() || 0;
  }

  set contentLength(length: number) {
    if (!this.hasHeader('Transfer-Encoding')) {
      this.setHeader('Content-Length', length);
    }
  }

  public setAttachmentHeaders(
    filename: string | undefined,
    options: contentDisposition.Options,
  ): this {
    filename && (this.contentType = extname(filename));

    return this.setHeader(
      'Content-Disposition',
      contentDisposition(filename, options),
    );
  }

  public matchContentType(type: string, ...types: string[]) {
    return typeIs.is(this.contentType, type, ...types);
  }

  /**
   * @deprecated 请使用 response.status
   * @see {status}
   **/
  declare statusCode: number;

  get status() {
    return this.statusCode;
  }

  set status(code: number) {
    assert(code >= 100 && code <= 999, `invalid status code: ${code}`);

    this.statusCode = code;
    this.explicitStatus = true;

    const message = statuses.message[code];
    if (message && this.req.httpVersionMajor < 2) {
      this.statusMessage = message;
    }

    if (statuses.empty[code]) {
      this.removeHeader('Content-Type');
      this.removeHeader('Content-Length');
      this.removeHeader('Transfer-Encoding');
      this._body = null;
    }
  }

  protected respondBody(): any {
    if (this.respond === false) return;

    if (!this.writable) return;

    let body = this._body;

    if (statuses.empty[this.statusCode]) {
      return this.end();
    }

    if (this.req.method === 'HEAD') {
      return this.respondHEAD();
    }

    if (body == null) {
      this.explicitNullBody
        ? this.respondNullBody()
        : this.respondByStatusCode();
    } else if (Buffer.isBuffer(body)) {
      this.end(body);
    } else if (typeof body === 'string') {
      this.end(body);
    } else if (body instanceof Stream) {
      body.pipe(this);
    } else {
      this.end(JSON.stringify(body));
    }
  }

  protected respondHEAD() {
    if (!this.hasHeader('Content-Length')) {
      const length = this.getContentLengthByBody();
      length !== undefined && (this.contentLength = length);
    }
    this.end();
  }

  protected respondNullBody() {
    this.contentLength = 0;
    this.end();
  }

  protected respondByStatusCode() {
    const body =
      this.req.httpVersionMajor >= 2
        ? String(this.statusCode)
        : this.statusMessage || String(this.statusCode);

    this.contentType = 'text';
    this.contentLength = Buffer.byteLength(body);
    this.end(body);
  }

  protected getContentLengthByBody(): number | undefined {
    const { _body: body } = this;

    if (!body || body instanceof Stream) return;
    if (typeof body === 'string') return Buffer.byteLength(body);
    if (Buffer.isBuffer(body)) return body.length;
    return Buffer.byteLength(JSON.stringify(body));
  }

  public static respondOK(response: WebResponse) {
    response.respondBody();
  }

  public static respondError(
    response: WebResponse,
    error?: Error | HttpError | null,
  ) {
    if (error == null) return;

    let err: HttpError;
    if (!(error instanceof Error)) {
      err = createHttpError(util.format('non-error thrown: %j', error));
    } else if (!(error instanceof HttpError)) {
      err = createHttpError(error);
    } else {
      err = error;
    }

    err.headersSent = response.headersSent;
    const shouldStop =
      !response.respond || response.headersSent || !response.writable;

    response.app.emit('error-log', err, response.ctx);

    if (shouldStop) return;

    response.getHeaderNames().forEach((name) => response.removeHeader(name));

    if (err.headers) {
      Object.entries(err.headers).forEach(([key, value]) => {
        response.setHeader(key, value);
      });
    }

    let statusCode = err.status || err.statusCode;

    if (err.code === 'ENOENT') {
      statusCode = 404;
    } else if (
      typeof statusCode !== 'number' ||
      !statuses.message[statusCode]
    ) {
      statusCode = 500;
    }

    const msg = err.expose ? err.message : statuses.message[statusCode]!;
    response.statusCode = err.status = statusCode;
    response.app.emit('error-end', msg, response.ctx);

    if (!response.headersSent && response.writable) {
      const body = JSON.stringify({
        message: msg,
      });
      response.contentType = 'json';
      response.contentLength = Buffer.byteLength(body);
      response.end(body);
    }
  }
}
