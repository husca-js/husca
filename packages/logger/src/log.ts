import type { HttpError, WebCtx } from '@husca/husca';
import prettyTime from 'pretty-time';
import bytes from 'bytes';
import type { Transporter } from '.';
import { colorCodes } from './colorCodes';
import chalk from 'chalk';

export const log = (
  printer: (...args: Parameters<Transporter>[1]) => void,
  ctx: WebCtx,
  start: [number, number],
  length_: undefined | null | number,
  err: null | HttpError,
  event?: 'finish' | 'close',
) => {
  const status = err
    ? err.isBoom
      ? err.output.statusCode
      : err.status || 500
    : ctx.response.status || 404;

  const color =
    colorCodes[((status / 100) | 0) as keyof typeof colorCodes] ||
    colorCodes[0]!;

  // get the human readable response length
  const length = [204, 205, 304].includes(status)
    ? ''
    : length_ == null
    ? '-'
    : bytes(length_).toLowerCase();

  const upstream = err
    ? chalk.red('xxx')
    : event === 'close'
    ? chalk.yellow('-x-')
    : chalk.gray('-->');

  printer(
    '  ' +
      upstream +
      ' ' +
      chalk.bold('%s') +
      ' ' +
      chalk.gray('%s') +
      ' ' +
      chalk[color]('%s') +
      ' ' +
      chalk.gray('%s') +
      ' ' +
      chalk.gray('%s'),
    ctx.request.method,
    ctx.request.url,
    status,
    prettyTime(process.hrtime(start)),
    length,
  );
};
