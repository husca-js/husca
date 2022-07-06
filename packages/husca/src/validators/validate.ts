import { Validator, GetValidatorType } from './Validator';

export const validate = async <
  T extends { [key: string]: P },
  P extends Validator,
>(
  source: any,
  validators: T,
): Promise<{ [K in keyof T]: GetValidatorType<T[K]> }> => {
  const src = await source;

  if (!src || typeof src !== 'object') {
    throw new Error('Unsupported source for validation');
  }

  const payload: Record<string, any> = {};
  await Promise.all(
    Object.entries(validators).map(async ([key, validator]) => {
      payload[key] = await Validator.validate(validator, src, key);
    }),
  );

  return payload as any;
};
