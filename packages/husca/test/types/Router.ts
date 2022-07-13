import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import {
  Commander,
  manageSlots,
  createSlot,
  CommanderOptions,
  ConsoleSlotManager,
  Router,
  RouterOptions,
  WebSlotManager,
} from '../../src';
import { noop } from '../helpers/noop';

describe('router generic', () => {
  const router = new Router({
    groupSlots: manageSlots().load<{ readonly hello: 'world' }>(
      createSlot(() => {}),
    ),
  });
  expectType<TypeEqual<Router<object & { hello: 'world' }>, typeof router>>(
    false,
  );
  expectType<
    TypeEqual<Router<object & { readonly hello: 'world' }>, typeof router>
  >(true);

  const commander = new Commander({
    groupSlots: manageSlots('console').load<{ readonly hello: 'world' }>(
      createSlot(noop, 'console'),
    ),
  });
  expectType<
    TypeEqual<Commander<object & { hello: 'world' }>, typeof commander>
  >(false);
  expectType<
    TypeEqual<Commander<object & { readonly hello: 'world' }>, typeof commander>
  >(true);
});

describe('group slots', () => {
  expectType<
    TypeEqual<WebSlotManager | undefined, RouterOptions['groupSlots']>
  >(true);

  expectType<
    TypeEqual<ConsoleSlotManager | undefined, CommanderOptions['groupSlots']>
  >(true);
});
