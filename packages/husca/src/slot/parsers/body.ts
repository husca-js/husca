import { Document } from '../../generator/Document';
import {
  validate,
  Validator,
  GetValidatorType,
  ValidatorError,
} from '../../validators';
import { WebSlot } from '../Slot';

export class BodySlot<
  Props extends { [key: string]: Validator },
> extends WebSlot<{
  readonly body: { [K in keyof Props]: GetValidatorType<Props[K]> };
}> {
  constructor(protected readonly props: Props) {
    super((ctx, next) => {
      return validate(ctx.request.body, props)
        .then((result) => {
          ctx.body = result;
        })
        .catch((e: Error) => {
          ctx.throw(e instanceof ValidatorError ? 400 : 500, e);
        })
        .then(next);
    });
  }

  public override toDocument(): Document {
    return new Document({
      key: 'body',
      type: 'object',
      properties: {},
    });
  }
}

export const body = <T extends { [key: string]: P }, P extends Validator>(
  fields: T,
) => new BodySlot<T>(fields);
