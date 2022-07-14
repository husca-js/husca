import { createSlot } from '@husca/husca';
import { Readable } from 'node:stream';
import StreamStringify from 'streaming-json-stringify';

export interface PrettyJsonOptions {
  /**
   * default to pretty response [true]
   */
  pretty?: boolean;

  /**
   * optional query-string param for pretty responses [none]
   */
  param?: string;

  /**
   * JSON spaces [2]
   */
  spaces?: number;
}

export const prettyJson = (options: PrettyJsonOptions = {}) => {
  const { pretty = true, spaces = 2, param } = options;

  return createSlot(async (ctx, next) => {
    await next();
    const { body, bodyType } = ctx.response;
    const isStream =
      bodyType === 'stream' && (body as Readable).readableObjectMode;
    const isJson = bodyType === 'json';

    if (!isJson && !isStream) return;

    const prettify =
      pretty || (param && ctx.request.query.hasOwnProperty(param));

    if (isStream) {
      ctx.response.contentType = 'json';
      const stringify = StreamStringify();
      if (prettify) {
        stringify.space = spaces;
      }
      ctx.send((body as Readable).pipe(stringify));
    } else if (prettify) {
      ctx.send(JSON.stringify(body, null, spaces));
    }
  });
};
