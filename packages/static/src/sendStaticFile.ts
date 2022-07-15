import { normalize, basename, extname, resolve, parse, sep } from 'node:path';
import { promisify } from 'node:util';
import fs, { createReadStream, Stats } from 'node:fs';
import resolvePath from 'resolve-path';
import { toArray, WebCtx, WebResponse } from '@husca/husca';

const stat = promisify(fs.stat);
const access = promisify(fs.access);
const notFoundCode = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR'];

export interface SendStaticFileOptions {
  /** Browser cache max-age in milliseconds. (defaults to 0) */
  maxAge?: number;
  /** Tell the browser the resource is immutable and can be cached indefinitely. (defaults to false) */
  immutable?: boolean;
  /** Allow transfer of hidden files. (defaults to false) */
  hidden?: boolean;
  /** Root directory to restrict file access. (defaults to '') */
  root?: string;
  /** Name of the index file to serve automatically when visiting the root location. (defaults to none) */
  index?: string | false;
  /** Try to serve the gzipped version of a file automatically when gzip is supported by a client and if the requested file with .gz extension exists. (defaults to true). */
  gzip?: boolean;
  /** Try to serve the brotli version of a file automatically when brotli is supported by a client and if the requested file with .br extension exists. (defaults to true). */
  brotli?: boolean;
  /** If not false (defaults to true), format the path to serve static file servers and not require a trailing slash for directories, so that you can do both /directory and /directory/. */
  format?: boolean;
  /** Function to set custom headers on response. */
  setHeaders?: (response: WebResponse, path: string, stats: Stats) => any;
  /** Try to match extensions from passed array to search for file when no extension is sufficed in URL. First found is served. (defaults to false) */
  extensions?: string[];
}

export const sendStaticFile = async (
  ctx: WebCtx,
  path: string,
  opts: SendStaticFileOptions = {},
) => {
  const {
    index = false,
    maxAge = 0,
    immutable = false,
    hidden = false,
    brotli = true,
    gzip = true,
    format = true,
    setHeaders,
  } = opts;
  const { response, request } = ctx;

  const extensions = toArray(opts.extensions || []);
  const root = opts.root ? normalize(resolve(opts.root)) : '';
  const trailingSlash = path[path.length - 1] === '/';

  path = decode(path.substring(parse(path).root.length));

  if (!path) {
    return ctx.throw(400, 'failed to decode path');
  }

  if (index && trailingSlash) {
    path += index;
  }

  path = resolvePath(root, path);

  // hidden file support, ignore
  if (!hidden && isHidden(root, path)) return;

  let encodingExt = '';
  // serve brotli file when possible otherwise gzipped file when possible
  if (
    brotli &&
    request.accept.encodings('br', 'identity') === 'br' &&
    (await exists(path + '.br'))
  ) {
    path = path + '.br';
    response.setHeader('Content-Encoding', 'br');
    response.removeHeader('Content-Length');
    encodingExt = '.br';
  } else if (
    gzip &&
    request.accept.encodings('gzip', 'identity') === 'gzip' &&
    (await exists(path + '.gz'))
  ) {
    path = path + '.gz';
    response.setHeader('Content-Encoding', 'gzip');
    response.removeHeader('Content-Length');
    encodingExt = '.gz';
  }

  if (extensions.length && !/\./.exec(basename(path))) {
    for (let i = 0; i < extensions.length; i++) {
      let ext = extensions[i]!;
      if (typeof ext !== 'string') {
        throw new TypeError(
          'option extensions must be array of strings or false',
        );
      }
      if (!/^\./.exec(ext)) {
        ext = `.${ext}`;
      }
      if (await exists(`${path}${ext}`)) {
        path = `${path}${ext}`;
        break;
      }
    }
  }

  let stats: Stats;
  try {
    stats = await stat(path);

    // Format the path to serve static file servers
    // and not require a trailing slash for directories,
    // so that you can do both `/directory` and `/directory/`
    if (stats.isDirectory()) {
      if (format && index) {
        path += `/${index}`;
        stats = await stat(path);
      } else {
        return;
      }
    }
  } catch (err) {
    ctx.throw(
      notFoundCode.includes((err as any).code) ? 404 : 500,
      err as Error,
    );
  }

  setHeaders?.(response, path, stats);

  if (!response.getHeader('Last-Modified')) {
    response.setHeader('Last-Modified', stats.mtime.toUTCString());
  }

  if (!response.getHeader('Cache-Control')) {
    const directives = [`max-age=${(maxAge / 1000) | 0}`];
    immutable && directives.push('immutable');
    response.setHeader('Cache-Control', directives.join(','));
  }

  response.contentLength = stats.size;
  response.contentType ||= type(path, encodingExt);
  ctx.send(createReadStream(path));

  return path;
};

function isHidden(root: string, path: string) {
  const paths = path.substring(root.length).split(sep);
  for (let i = 0; i < paths.length; i++) {
    if (paths[i]![0] === '.') return true;
  }
  return false;
}

function type(file: string, ext: string) {
  return ext !== '' ? extname(basename(file, ext)) : extname(file);
}

function decode(path: string) {
  try {
    return decodeURIComponent(path);
  } catch (err) {
    return '';
  }
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch (e) {
    return false;
  }
}
