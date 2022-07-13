import { HttpError } from 'http-errors';
import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { WebApp, WebCtx } from '../../../src';

const app = new WebApp({ routers: [] });

describe('error-log', () => {
  app.on('error-log', (err, ctx) => {
    expectType<TypeEqual<HttpError, typeof err>>(true);
    expectType<TypeEqual<WebCtx, typeof ctx>>(true);
  });
});

describe('error-end', () => {
  app.on('error-end', (msg, ctx) => {
    expectType<TypeEqual<string, typeof msg>>(true);
    expectType<TypeEqual<WebCtx, typeof ctx>>(true);
  });
});
