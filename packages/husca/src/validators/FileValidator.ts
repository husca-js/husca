import { PersistentFile, File as InternalFile } from 'formidable';
import {
  TOptional,
  TransformedValidator,
  Validator,
  ValidatorOptions,
  ValidatorTransformFn,
} from './Validator';
import { ValidatorError } from './ValidatorError';
import { getContentType } from '../utils/getContentType';

export interface FileOptions<T> extends ValidatorOptions<T> {
  maxSize?: number;
  mimeTypes?: string[];
}

export interface File extends InternalFile {
  hash: 'string';
  hashAlgorithm: 'md5';
}

export class FileValidator<T = File> extends Validator<T> {
  protected declare config: FileOptions<T>;

  public declare optional: () => FileValidator<T | TOptional>;

  public declare transform: <T1>(
    fn: ValidatorTransformFn<T, T1>,
  ) => TransformedValidator<T1>;

  public maxSize(byte: number): this {
    this.config.maxSize = byte;
    return this;
  }

  public mimeTypes(mineOrExt: string, ...others: string[]): this;
  public mimeTypes(mineOrExt: string[]): this;
  public mimeTypes(mineOrExt: string[] | string, ...others: string[]): this {
    this.config.mimeTypes = [
      ...new Set(
        ([] as string[])
          .concat(mineOrExt)
          .concat(others)
          .map(getContentType)
          .filter(Boolean),
      ),
    ] as string[];
    return this;
  }

  protected override isEmpty(value: any): boolean {
    return super.isEmpty(value) || (Array.isArray(value) && !value.length);
  }

  protected async validateValue(
    value: any,
    key: string,
    superKeys: string[],
  ): Promise<File | File[]> {
    const { maxSize = Infinity, mimeTypes } = this.config;

    if (Array.isArray(value) && value.length > 1) {
      throw new ValidatorError('{{label}} must be single file', key, superKeys);
    }

    const file: File = Array.isArray(value) ? value[0] : value;

    if (!(file instanceof PersistentFile)) {
      throw new ValidatorError('{{label}} must be file', key, superKeys);
    }

    if (file.size > maxSize) {
      throw new ValidatorError('{{label}} is too large', key, superKeys);
    }

    if (mimeTypes && (!file.mimetype || !mimeTypes.includes(file.mimetype))) {
      throw new ValidatorError(
        '{{label}} fail to match given mime types',
        key,
        superKeys,
      );
    }

    return file;
  }
}
