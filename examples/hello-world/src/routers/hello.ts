import { Router } from '@husca/husca';

export const router = new Router();

router.get('/').action((ctx) => {
  ctx.send(200, 'hello world');
});
