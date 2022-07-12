import { createSlot } from '../slot/createSlot';
import { MixedSlot, Slot } from '../slot/Slot';
import { SlotTarget } from '../slot/SlotTarget';

export type Next = () => Promise<any>;
export type Middleware = (ctx: any, next?: Next) => Promise<any>;

export const composeToMiddleware = (slots: Slot[]): Middleware => {
  return (ctx, next) => {
    let lastIndex = -1;

    const dispatch = (i: number): any => {
      if (i <= lastIndex) {
        return Promise.reject(new Error('next() called multiple times'));
      }

      const fn = i === slots.length ? next : slots[i]!.fn;
      lastIndex = i;

      if (!fn) {
        return Promise.resolve();
      }

      try {
        return Promise.resolve(fn(ctx, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    };

    return dispatch(0);
  };
};

export const composeToSlot = (slots: Slot[]): MixedSlot => {
  return createSlot(composeToMiddleware(slots), SlotTarget[2]);
};
