import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import {
  ConsoleSlotManager,
  manageSlots,
  MixedSlotManager,
  WebSlotManager,
  createSlot,
} from '../../../src';
import { noop } from '../../helpers/noop';

type GetManagerType<T> = T extends
  | WebSlotManager<infer R>
  | ConsoleSlotManager<infer R>
  | MixedSlotManager<infer R>
  ? R
  : never;

describe('slot instance', () => {
  expectType<WebSlotManager>(manageSlots());
  expectType<WebSlotManager>(manageSlots('web'));
  expectType<ConsoleSlotManager>(manageSlots('console'));
  expectType<MixedSlotManager>(manageSlots('mixed'));
});

describe('web slot manager generic', () => {
  const slots = manageSlots()
    .load(manageSlots().load(createSlot<{ readonly x: number }>(noop)))
    .load(createSlot<{ y: number; z: number }>('mixed', noop));

  expectType<
    TypeEqual<
      object & { x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(false);
  expectType<
    TypeEqual<
      object & { readonly x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(true);
});

describe('console slot manager generic', () => {
  const slots = manageSlots('console')
    .load(
      manageSlots('console').load(
        createSlot<{ readonly x: number }>('console', noop),
      ),
    )
    .load(createSlot<{ y: number; z: number }>('mixed', noop));

  expectType<
    TypeEqual<
      object & { x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(false);
  expectType<
    TypeEqual<
      object & { readonly x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(true);
});

describe('mixed slot manager generic', () => {
  const slots = manageSlots('mixed')
    .load(
      manageSlots('mixed').load(
        createSlot<{ readonly x: number }>('mixed', noop),
      ),
    )
    .load(createSlot<{ y: number; z: number }>('mixed', noop));

  expectType<
    TypeEqual<
      object & { x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(false);
  expectType<
    TypeEqual<
      object & { readonly x: number } & { y: number; z: number },
      GetManagerType<typeof slots>
    >
  >(true);
});

describe('incompact', () => {
  manageSlots().load(manageSlots('web'));
  manageSlots().load(manageSlots('mixed'));
  manageSlots().load(createSlot('web', noop));
  manageSlots().load(createSlot('mixed', noop));
  // @ts-expect-error
  manageSlots().load(createSlot('console', noop));
  // @ts-expect-error
  manageSlots().load(manageSlots('console'));

  manageSlots('console').load(manageSlots('console'));
  manageSlots('console').load(manageSlots('mixed'));
  manageSlots('console').load(createSlot('console', noop));
  manageSlots('console').load(createSlot('mixed', noop));
  // @ts-expect-error
  manageSlots('console').load(createSlot('web', noop));
  // @ts-expect-error
  manageSlots('console').load(manageSlots());

  manageSlots('mixed').load(manageSlots('mixed'));
  manageSlots('mixed').load(createSlot('mixed', noop));
  // @ts-expect-error
  manageSlots('mixed').load(manageSlots('console'));
  // @ts-expect-error
  manageSlots('mixed').load(manageSlots());
  // @ts-expect-error
  manageSlots('mixed').load(createSlot('console', noop));
  // @ts-expect-error
  manageSlots('mixed').load(createSlot('web', noop));
});

describe('load empty slot', () => {
  manageSlots()
    .load(null)
    // @ts-expect-error
    .load(undefined);

  manageSlots('console')
    .load(null)
    // @ts-expect-error
    .load(undefined);

  manageSlots('mixed')
    .load(null)
    // @ts-expect-error
    .load(undefined);
});

describe('invalid usage', () => {
  manageSlots();
  // @ts-expect-error
  manageSlots('');
  // @ts-expect-error
  manageSlots('other');
});
