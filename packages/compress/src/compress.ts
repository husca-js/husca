import zlib from 'node:zlib';
import compressible from 'compressible';
import Stream from 'stream';
import bytes from 'bytes';
import { createSlot } from '@husca/husca';
import { EncodingMethods, Encodings } from './encodings';

const NO_TRANSFORM_REGEX = /(?:^|,)\s*?no-transform\s*?(?:,|$)/;
const emptyBodyStatues = [204, 205, 304];

export interface CompressOptions {
  /**
   * An optional function that checks the response content type to decide whether to compress. By default, it uses compressible.
   */
  filter?: (mimeType: string) => boolean;

  /**
   * Minimum response size in bytes to compress. Default 1024 bytes or 1kb.
   */
  threshold?: number | string;

  /**
   * An optional string, which specifies what encoders to use for requests
   * without Accept-Encoding. Default: 'idenity'.
   */
  defaultEncoding?: EncodingMethods;

  /**
   * Options for brotli compression.
   */
  br?: zlib.BrotliOptions | false;

  /**
   * Options for gzip compression.
   */
  gzip?: zlib.ZlibOptions | false;

  /**
   * Options for deflate compression.
   */
  deflate?: zlib.ZlibOptions | false;
}

export const compress = (options: CompressOptions = {}) => {
  let {
    filter = compressible,
    threshold = 1024,
    defaultEncoding = 'identity',
  } = options;
  if (typeof threshold === 'string') {
    threshold = bytes(threshold);
  }

  const preferredEncodings = Encodings.preferredEncodings.filter(
    (encoding) => options[encoding] !== false && options[encoding] !== null,
  );
  const encodingOptions: {
    [K in EncodingMethods]?: object;
  } = {};
  preferredEncodings.forEach((encoding) => {
    encodingOptions[encoding] = {
      ...Encodings.encodingMethodDefaultOptions[encoding],
      ...(options[encoding] || {}),
    };
  });

  return createSlot<{ needCompress?: boolean }>(async (ctx, next) => {
    const { response, request } = ctx;
    response.vary('Accept-Encoding');
    await next();

    let { body } = response;

    if (
      // early exit if there's no content body or the body is already encoded
      ctx.needCompress === false ||
      !body ||
      response.headersSent ||
      !response.writable ||
      request.method === 'HEAD' ||
      emptyBodyStatues.includes(+response.status) ||
      response.getHeader('Content-Encoding') ||
      // forced compression or implied
      !(ctx.needCompress === true || filter(response.contentType)) ||
      // don't compress for Cache-Control: no-transform
      // https://tools.ietf.org/html/rfc7234#section-5.2.1.6
      NO_TRANSFORM_REGEX.test(response.getHeader('Cache-Control') as string) ||
      // don't compress if the current response is below the threshold
      (threshold && (response.contentLength ?? 0) < threshold)
    ) {
      return;
    }

    // get the preferred content encoding
    const encodings = new Encodings({ preferredEncodings });
    encodings.parseAcceptEncoding(
      (request.headers['accept-encoding'] as EncodingMethods | undefined) ||
        defaultEncoding,
    );
    const encoding = encodings.getPreferredContentEncoding();
    const compress = Encodings.encodingMethods[encoding];

    // identity === no compression
    if (encoding === 'identity' || !compress) return;

    /** begin compression logic **/

    if (response.bodyType === 'json') {
      body = JSON.stringify(body);
    }

    response
      .setHeader('Content-Encoding', encoding)
      .removeHeader('Content-Length');

    const stream = compress(encodingOptions[encoding]);
    ctx.send(stream);

    if (body instanceof Stream) {
      body.pipe(stream);
    } else {
      stream.end(body);
    }
  });
};
