import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  Commander,
  CommanderParser,
  Router,
  RouterParser,
} from '../../src/router';
import { Slot } from '../../src/slot';

const parsers = <const>[
  ['web', RouterParser],
  ['console', CommanderParser],
];

for (const [name, Parser] of parsers) {
  describe(`${name} parser`, () => {
    const routerLength = {
      web: 5,
      console: 3,
    };

    test('parse path', async () => {
      const routerSlots: Slot[] = [];
      const parser = new Parser(false, routerSlots);

      expect(routerSlots).toHaveLength(0);
      await parser.parsePath(path.resolve('./test/mocks'));
      expect(routerSlots).toHaveLength(routerLength[name]);
    });

    test('duplicated routers', async () => {
      const routerSlots: Slot[] = [];
      const parser = new Parser(false, routerSlots);

      await Promise.all([
        parser.parsePath(path.resolve('./test/mocks')),
        parser.parsePath(path.resolve('./test/mocks/routers')),
      ]);
      expect(routerSlots).toHaveLength(routerLength[name]);
    });

    test('parse router', () => {
      const createRouters = () => ({
        web: [new Router(), new Router()],
        console: [new Commander(), new Commander()],
      });

      const routerSlots: Slot[] = [];
      const parser = new Parser(false, routerSlots);
      const routers = createRouters();

      parser.parseRouter(routers[name]);
      expect(routerSlots).toHaveLength(2);
      parser.parseRouter(routers[name]);
      expect(routerSlots).toHaveLength(2);

      parser.parseRouter(createRouters()[name]);
      expect(routerSlots).toHaveLength(4);
      parser.parseRouter(createRouters()[name]);
      expect(routerSlots).toHaveLength(6);

      parser.parseRouter(createRouters()[name === 'web' ? 'console' : 'web']);
      expect(routerSlots).toHaveLength(6);
    });

    test('level', async () => {
      const parser = new Parser(false, []);

      expect(parser.level).toBe(0);
      const promise = parser.parsePath(path.resolve('./test/mocks'));
      expect(parser.level).toBe(1);
      await promise;
      expect(parser.level).toBe(0);

      expect(parser.level).toBe(0);
      const promise1 = parser.parsePath(path.resolve('./test/mocks'));
      expect(parser.level).toBe(1);
      const promise2 = parser.parsePath(path.resolve('./test/mocks'));
      expect(parser.level).toBe(2);
      await Promise.all([promise1, promise2]);
      expect(parser.level).toBe(0);
    });
  });
}
