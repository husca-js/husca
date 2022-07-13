import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import {
  CommanderBuilder,
  ConsoleCtx,
  createSlot,
  manageSlots,
  RouterBuilder,
  WebCtx,
} from '../../../src';
import { noop } from '../../helpers/noop';

describe('router generic', () => {
  new RouterBuilder('/', [], [], {
    slots: [
      createSlot<{ a: 'a' }>(noop),
      createSlot<{ readonly b: 'b' }>(noop),
    ],
    action: (ctx) => {
      expectType<
        TypeEqual<WebCtx & { a: 'a' } & { readonly b: 'b' }, typeof ctx>
      >(true);
    },
  });

  new RouterBuilder('/', [], [], {
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: [],
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: undefined,
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: [createSlot<{ a: 'a' }>(noop), createSlot('mixed', noop)],
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(false);
      expectType<TypeEqual<WebCtx & { a: 'a' }, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: [createSlot<{ a: 'a' }>(noop), manageSlots('mixed')],
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(false);
      expectType<TypeEqual<WebCtx & { a: 'a' }, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: [
      createSlot<{ a: 'a' }>(noop),
      manageSlots().load<{ b: 'b' }>(createSlot(noop)).load(createSlot(noop)),
    ],
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(false);
      expectType<TypeEqual<WebCtx & { a: 'a' } & { b: 'b' }, typeof ctx>>(true);
    },
  });

  new RouterBuilder('/', [], [], {
    slots: [
      manageSlots().load(createSlot<{ a: 'a' }>(noop)),
      manageSlots().load<{ b: 'b' }>(createSlot(noop)).load(createSlot(noop)),
    ],
    action: (ctx) => {
      expectType<TypeEqual<WebCtx, typeof ctx>>(false);
      expectType<TypeEqual<WebCtx & { a: 'a' } & { b: 'b' }, typeof ctx>>(true);
    },
  });
});

describe('commander generic', () => {
  new CommanderBuilder('/', [], {
    slots: [
      createSlot<{ a: 'a' }>('console', noop),
      createSlot<{ readonly b: 'b' }>('console', noop),
    ],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
      expectType<
        TypeEqual<ConsoleCtx & { a: 'a' } & { readonly b: 'b' }, typeof ctx>
      >(true);
    },
  });

  new CommanderBuilder('/', [], {
    slots: [createSlot<{ a: 'a' }>('console', noop), createSlot('mixed', noop)],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx & { a: 'a' }, typeof ctx>>(true);
    },
  });

  new CommanderBuilder('/', [], {
    slots: [],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(true);
    },
  });

  new CommanderBuilder('/', [], {
    slots: undefined,
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(true);
    },
  });

  new CommanderBuilder('/', [], {
    slots: [createSlot<{ a: 'a' }>('console', noop), manageSlots('mixed')],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
      expectType<TypeEqual<ConsoleCtx & { a: 'a' }, typeof ctx>>(true);
    },
  });

  new CommanderBuilder('/', [], {
    slots: [
      createSlot<{ a: 'a' }>('console', noop),
      manageSlots('console')
        .load<{ b: 'b' }>(createSlot('console', noop))
        .load(createSlot('console', noop)),
    ],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
      expectType<TypeEqual<ConsoleCtx & { a: 'a' } & { b: 'b' }, typeof ctx>>(
        true,
      );
    },
  });

  new CommanderBuilder('/', [], {
    slots: [
      manageSlots('console').load(createSlot<{ a: 'a' }>('console', noop)),
      manageSlots('console')
        .load<{ b: 'b' }>(createSlot('console', noop))
        .load(createSlot('console', noop)),
    ],
    action: (ctx) => {
      expectType<TypeEqual<ConsoleCtx, typeof ctx>>(false);
      expectType<TypeEqual<ConsoleCtx & { a: 'a' } & { b: 'b' }, typeof ctx>>(
        true,
      );
    },
  });
});

describe('router action has no next parameter', () => {
  new RouterBuilder('/', [], [], {
    action: noop,
  });
  new RouterBuilder('/', [], [], {
    action: (_ctx) => {},
  });
  new RouterBuilder('/', [], [], {
    // @ts-expect-error
    action: (_ctx, _next) => {},
  });
});

describe('commander action has no next parameter', () => {
  new CommanderBuilder('/', [], {
    action: noop,
  });
  new CommanderBuilder('/', [], {
    action: (_ctx) => {},
  });
  new CommanderBuilder('/', [], {
    // @ts-expect-error
    action: (_ctx, _next) => {},
  });
});

describe('invalid router usage', () => {
  new RouterBuilder('/', [], [], {
    slots: [
      createSlot(noop),
      createSlot('mixed', noop),
      manageSlots('mixed'),
      // @ts-expect-error
      manageSlots('console'),
      // @ts-expect-error
      createSlot('console', noop),
      // @ts-expect-error
      'x',
      // @ts-expect-error
      1,
      // @ts-expect-error
      true,
      // @ts-expect-error
      {},
    ],
  });
});

describe('invalid commander usage', () => {
  new CommanderBuilder('/', [], {
    slots: [
      createSlot('console', noop),
      createSlot('mixed', noop),
      manageSlots('mixed'),
      // @ts-expect-error
      manageSlots('web'),
      // @ts-expect-error
      createSlot(noop),
      // @ts-expect-error
      'x',
      // @ts-expect-error
      1,
      // @ts-expect-error
      true,
      // @ts-expect-error
      {},
    ],
  });
});
