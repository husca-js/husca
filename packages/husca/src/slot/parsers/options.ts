import { Document } from '../../generator/Document';
import { validate, Validator, GetValidatorType } from '../../validators';
import yargs from 'yargs';
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
    super(async (ctx, next) => {
      const input = yargs([]).help(false).version(false);

      if (alias) {
        Object.entries(alias).forEach(([name, aliasList]) => {
          input.options(name, {
            alias: aliasList,
          });
        });
      }

      const { _, $0, ...rawOptions } = input.parseSync(ctx.request.argv);

      ctx.options = await validate(rawOptions, props);
      return next();
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
