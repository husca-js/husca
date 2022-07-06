import mimeTypes from 'mime-types';
import LRU from 'ylru';

const cache = new LRU(100);

export const getContentType = (type: string): string | false => {
  let mimeType: string | false | undefined = cache.get(type);

  if (!mimeType) {
    mimeType = mimeTypes.contentType(type);
    cache.set(type, mimeType);
  }

  return mimeType;
};
