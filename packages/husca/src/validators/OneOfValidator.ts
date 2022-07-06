import {
  TransformedValidator,
  Validator,
  ValidatorOptions,
  ValidatorTransformFn,
} from './Validator';
import { ValidatorError } from './ValidatorError';

interface OneOfOptions<T> extends ValidatorOptions<T> {
  validators: Validator[];
}

export class OneOfValidator<T = never> extends Validator<T> {
  protected declare config: OneOfOptions<T>;

  constructor(rules: Validator[]) {
    super();
    this.config.validators = rules;
  }

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  protected override isEmpty(_: any): boolean {
    return false;
  }

  protected async validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): Promise<any> {
    const { validators } = this.config;

    for (let i = 0; i < validators.length; ++i) {
      try {
        return await (validators[i]! as OneOfValidator).validateFromValue(
          value,
          key,
          superKeys,
        );
      } catch {}
    }

    throw new ValidatorError(
      '{{label}} fail to pass given validators',
      key,
      superKeys,
    );
  }
}
