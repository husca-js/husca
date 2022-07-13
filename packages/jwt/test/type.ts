import { GetSlotType } from '@husca/husca';
import { expectType, TypeEqual } from 'ts-expect';
import { describe } from 'vitest';
import { jwt, JWTOptions } from '../src';

describe('normal', () => {
  const slot = jwt({ secret: '' });
  expectType<
    TypeEqual<
      GetSlotType<typeof slot>,
      { readonly jwt: { user: object; token: string } }
    >
  >(true);
});

describe('user interface', () => {
  {
    const slot = jwt<{ hello: 'x' }>({ secret: '' });
    expectType<
      TypeEqual<
        GetSlotType<typeof slot>,
        { readonly jwt: { user: { hello: 'x' }; token: string } }
      >
    >(true);
  }

  {
    const slot = jwt<string>({ secret: '' });
    expectType<
      TypeEqual<
        GetSlotType<typeof slot>,
        { readonly jwt: { user: string; token: string } }
      >
    >(true);
  }
});

describe('invalid usage', () => {
  jwt<JWTOptions['algorithms']>({ secret: '' });
  // @ts-expect-error
  jwt<JWTOptions['complete']>({ secret: '' });
  // @ts-expect-error
  jwt();
  // @ts-expect-error
  jwt({});
});
