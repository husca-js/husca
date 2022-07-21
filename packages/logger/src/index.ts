import util from 'node:util';
import { createSlot, HttpError } from '@husca/husca';
import chalk from 'chalk';
import { Counter } from './Counter';
import { log } from './log';

export type Transporter = (
  str: string,
  args: [
    arg1: string,
    arg2: string,
    arg3: string,
    arg4?: number,
    arg5?: string,
    arg6?: string,
  ],
) => void;

export const logger = (
  options: Transporter | { transporter?: Transporter } = {},
) => {
  let transporter: Transporter | undefined;
  if (typeof options === 'function') {
    transporter = options;
  } else if (options.transporter) {
    transporter = options.transporter;
  }

  const printer = (...args: Parameters<Transporter>[1]) => {
    if (transporter) {
      transporter(util.format(...args), args);
    } else {
      console.log(...args);
    }
  };

  return createSlot(async (ctx, next) => {
    const start = process.hrtime();

    printer(
      '  ' +
        chalk.gray('<--') +
        ' ' +
        chalk.bold('%s') +
        ' ' +
        chalk.gray('%s'),
      ctx.request.method,
      ctx.request.url,
    );

    try {
      await next();
    } catch (err) {
      log(printer, ctx, start, null, err as HttpError);
      throw err;
    }

    // calculate the length of a streaming response
    // by intercepting the stream with a counter.
    // only necessary if a content-length header is currently not set.
    const {
      response: { contentLength, body, bodyType },
      response,
    } = ctx;

    let counter: Counter;
    if (bodyType === 'stream' && (body as NodeJS.ReadableStream).readable) {
      counter = new Counter();
      ctx.send(
        (body as NodeJS.ReadableStream)
          .pipe(counter)
          .on('error', response.onError),
      );
    }

    const onfinish = done.bind(null, 'finish');
    const onclose = done.bind(null, 'close');

    response.once('finish', onfinish).once('close', onclose);

    function done(this: null, event: 'finish' | 'close') {
      response
        .removeListener('finish', onfinish)
        .removeListener('close', onclose);
      log(
        printer,
        ctx,
        start,
        counter ? counter.length : contentLength,
        null,
        event,
      );
    }
  });
};
