import { WebApp, manageSlots, Router } from '@husca/husca';
import Boom from 'boom';
import { createReadStream } from 'fs';
import { Transporter, logger } from '../src';

export const server = (
  options: Transporter | { transporter?: Transporter } = {},
) => {
  const app = new WebApp({
    globalSlots: manageSlots().load(logger(options)),
  });

  const router = new Router();

  app.mountRouter(router);

  router.get('/200', {
    action(ctx) {
      ctx.send('hello world');
    },
  });

  router.get('/301', {
    action(ctx) {
      ctx.send(301);
    },
  });

  router.get('/304', {
    action(ctx) {
      ctx.send(304);
    },
  });

  router.get('/404', {
    action(ctx) {
      ctx.send(404, 'not found');
    },
  });

  router.get('/500', {
    action(ctx) {
      ctx.send(500, 'server error');
    },
  });

  router.get('/500-boom', {
    action(ctx) {
      ctx.throw(Boom.badImplementation('terrible implementation'));
    },
  });

  router.get('/error', {
    action() {
      throw new Error('oh no');
    },
  });

  router.get('/stream', {
    action(ctx) {
      ctx.send(createReadStream('./test/file.txt'));
    },
  });

  return app;
};
