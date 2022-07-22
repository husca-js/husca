import { ReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createSlot } from '@husca/husca';
import calculate from 'etag';

export const etag = (options: calculate.Options = {}) => {
  return createSlot(async (ctx, next) => {
    await next();

    const { response, request } = ctx;
    const { body } = response;

    if (body === null || response.hasHeader('etag')) return;
    if (response.status < 200 || response.status > 299) return;

    let entity: Parameters<typeof calculate>[0];

    if (body instanceof ReadStream) {
      entity = await stat(body.path);
    } else if (typeof body === 'string' || Buffer.isBuffer(body)) {
      entity = body;
    } else {
      entity = JSON.stringify(body);
    }

    if (entity) {
      response.setHeader('etag', calculate(entity, options));
    }

    if (request.fresh) {
      ctx.send(304, null);
    }
  });
};
