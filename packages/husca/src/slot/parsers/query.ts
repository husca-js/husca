import { Document } from '../../generator/Document';
import {
  validate,
  Validator,
  GetValidatorType,
  ValidatorError,
} from '../../validators';
import { WebSlot } from '../Slot';

export class QuerySlot<
  Props extends { [key: string]: Validator },
> extends WebSlot<{
  readonly query: { [K in keyof Props]: GetValidatorType<Props[K]> };
}> {
  constructor(protected readonly props: Props) {
    super((ctx, next) => {
      return validate(ctx.request.query, props)
        .then((result) => {
          ctx.query = result;
        })
        .catch((e: Error) => {
          ctx.throw(e instanceof ValidatorError ? 400 : 500, e);
        })
        .then(next);
    });
  }

  public override toDocument(): Document {
    return new Document({
      key: 'query',
      type: 'object',
      properties: {},
    });
  }
}

export const query = <T extends { [key: string]: P }, P extends Validator>(
  fields: T,
) => new QuerySlot<T>(fields);
