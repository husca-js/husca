import parser from 'yargs-parser';
import { Document } from '../../document';
import { validate, Validator, GetValidatorType } from '../../validators';
import { ConsoleSlot } from '../Slot';

export class OptionsSlot<
  Props extends { [key: string]: Validator },
> extends ConsoleSlot<{
  readonly options: { [K in keyof Props]: GetValidatorType<Props[K]> };
}> {
  constructor(
    protected readonly props: Props,
    protected readonly alias?: { [key: string]: string | string[] },
  ) {
    super((ctx, next) => {
      let options = ctx.request.options;

      if (alias && Object.keys(alias).length) {
        const { _, ...rawOptions } = parser(ctx.request.argv, {
          alias,
        });
        options = rawOptions;
      }

      return validate(options, props)
        .then((result) => {
          ctx.options = result;
        })
        .then(next);
    });
  }

  public override toDocument(): Document {
    return new Document({
      key: 'options',
      type: 'object',
      properties: {},
    });
  }
}

export const options = <
  T extends { [key: string]: P },
  P extends Validator,
  Alias extends keyof T,
>(
  fields: T,
  alias?: { [key in Alias]: string | string[] },
) => new OptionsSlot<T>(fields, alias);
