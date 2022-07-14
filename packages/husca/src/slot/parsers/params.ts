import {
  validate,
  Validator,
  GetValidatorType,
  ValidatorError,
} from '../../validators';
import { WebSlot } from '../Slot';

export class ParamsSlot<
  Props extends { [key: string]: Validator },
> extends WebSlot<{
  readonly params: { [K in keyof Props]: GetValidatorType<Props[K]> };
}> {
  constructor(protected readonly props: Props) {
    super((ctx, next) => {
      return validate(ctx.request.params, props)
        .then((result) => {
          ctx.params = result;
        })
        .catch((e: Error) => {
          ctx.throw(e instanceof ValidatorError ? 400 : 500, e);
        })
        .then(next);
    });
  }
}

export const params = <T extends { [key: string]: P }, P extends Validator>(
  fields: T,
) => new ParamsSlot<T>(fields);
