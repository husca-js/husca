import errors from 'http-errors';
import zlib from 'zlib';

export type EncodingMethods =
  | 'gzip'
  | 'deflate'
  | 'br'
  | 'identity'
  | 'compress'
  | '*';

export class Encodings {
  static encodingMethods: { [K in EncodingMethods]?: Function } = {
    gzip: zlib.createGzip,
    deflate: zlib.createDeflate,
    br: zlib.createBrotliCompress,
  };
  static encodingMethodDefaultOptions: {
    [K in EncodingMethods]?: object;
  } = {
    gzip: {},
    deflate: {},
    br: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
    },
  };
  // how we treat `Accept-Encoding: *`
  protected static wildcardAcceptEncoding = ['gzip', 'deflate'] as const;
  // our preferred encodings
  static preferredEncodings = ['br', 'gzip', 'deflate'] as const;
  protected static reDirective =
    /^\s*(gzip|compress|deflate|br|identity|\*)\s*(?:;\s*q\s*=\s*(\d(?:\.\d)?))?\s*$/;

  public readonly encodingWeights = new Map<EncodingMethods, number>();
  protected readonly reDirective: RegExp;
  protected readonly preferredEncodings: readonly EncodingMethods[];
  protected readonly wildcardAcceptEncoding: readonly EncodingMethods[];

  constructor(
    options: {
      reDirective?: RegExp;
      preferredEncodings?: EncodingMethods[];
      wildcardAcceptEncoding?: EncodingMethods[];
    } = {},
  ) {
    this.wildcardAcceptEncoding =
      options.wildcardAcceptEncoding || Encodings.wildcardAcceptEncoding;
    this.preferredEncodings =
      options.preferredEncodings || Encodings.preferredEncodings;
    this.reDirective = options.reDirective || Encodings.reDirective;
  }

  parseAcceptEncoding(acceptEncoding: string = '*'): void {
    const { encodingWeights, reDirective } = this;

    acceptEncoding.split(',').forEach((directive) => {
      const match = reDirective.exec(directive);
      if (!match) return; // not a supported encoding above

      const encoding = match[1] as EncodingMethods;

      // weight must be in [0, 1]
      let weight = Number(match[2]);
      weight = Number.isNaN(weight) ? 1 : weight;
      weight = Math.max(weight, 0);
      weight = Math.min(weight, 1);

      if (encoding === '*') {
        // set the weights for the default encodings
        this.wildcardAcceptEncoding.forEach((enc) => {
          if (!encodingWeights.has(enc)) encodingWeights.set(enc, weight);
        });
        return;
      }

      encodingWeights.set(encoding, weight);
    });
  }

  getPreferredContentEncoding(): EncodingMethods {
    const { encodingWeights, preferredEncodings } = this;

    // get ordered list of accepted encodings
    const acceptedEncodings = Array.from(encodingWeights.keys())
      // sort by weight
      .sort((a, b) => encodingWeights.get(b)! - encodingWeights.get(a)!)
      // filter by supported encodings
      .filter(
        (encoding) =>
          encoding === 'identity' ||
          typeof Encodings.encodingMethods[encoding] === 'function',
      );

    // group them by weights
    const weightClasses = new Map();
    acceptedEncodings.forEach((encoding) => {
      const weight = encodingWeights.get(encoding);
      if (!weightClasses.has(weight)) weightClasses.set(weight, new Set());
      weightClasses.get(weight).add(encoding);
    });

    // search by weight, descending
    const weights = Array.from(weightClasses.keys()).sort((a, b) => b - a);
    for (let i = 0; i < weights.length; i++) {
      // encodings at this weight
      const encodings = weightClasses.get(weights[i]);
      // return the first encoding in the preferred list
      for (let j = 0; j < preferredEncodings.length; j++) {
        const preferredEncoding = preferredEncodings[j]!;
        if (encodings.has(preferredEncoding)) return preferredEncoding;
      }
    }

    // no encoding matches, check to see if the client set identity, q=0
    if (encodingWeights.get('identity') === 0)
      throw errors(406, 'Please accept br, gzip, deflate, or identity.');

    // by default, return nothing
    return 'identity';
  }
}
