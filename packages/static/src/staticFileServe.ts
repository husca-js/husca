import { resolve } from 'node:path';
import { createSlot, HttpError } from '@husca/husca';
import { SendStaticFileOptions, sendStaticFile } from './sendStaticFile';

export interface StaticOptions extends SendStaticFileOptions {
  /** If true, serves after return next(), allowing any downstream middleware to respond first. */
  defer?: boolean;
}

const onError = (err: unknown) => {
  if ((err as HttpError).status !== 404) {
    throw err;
  }
};

export const staticFileServe = (root: string, opts: StaticOptions = {}) => {
  opts = Object.assign({}, opts);
  opts.root = resolve(root);

  if (opts.index !== false) {
    opts.index = opts.index || 'index.html';
  }

  if (opts.defer) {
    return createSlot(async (ctx, next) => {
      await next();

      const {
        request,
        request: { method },
        response,
      } = ctx;

      if (
        (method !== 'HEAD' && method !== 'GET') ||
        response.body != null ||
        response.status !== 404
      ) {
        return;
      }

      try {
        await sendStaticFile(ctx, request.pathname, opts);
      } catch (err) {
        onError(err);
      }
    });
  }

  return createSlot(async (ctx, next) => {
    const {
      request,
      request: { method },
    } = ctx;
    let done: string | undefined;

    if (method === 'HEAD' || method === 'GET') {
      try {
        done = await sendStaticFile(ctx, request.pathname, opts);
      } catch (err) {
        onError(err);
      }
    }

    if (!done) return next();
  });
};
