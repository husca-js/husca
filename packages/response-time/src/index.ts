import { createSlot } from '@husca/husca';

export interface ResponseTimeOptions {
  /**
   * `true` 则使用微妙，`false` 则使用毫秒（默认：true）
   */
  hrtime?: boolean;
}

export const responseTime = (options: ResponseTimeOptions = {}) => {
  const { hrtime = true } = options;

  return createSlot((ctx, next) => {
    const start = process.hrtime();

    return next().finally(() => {
      const deltas = process.hrtime(start);
      let delta = deltas[0] * 1000 + deltas[1] / 1000000;

      if (!hrtime) {
        delta = Math.round(delta);
      }

      ctx.response.setHeader('X-Response-Time', delta + 'ms');
    });
  });
};
