import path from 'node:path';
import { existsSync, statSync } from 'node:fs';
import glob from 'glob';

const ext = 'ts,js,mts,mjs,cts,cjs';

export namespace finder {
  export interface Options {
    pattern: string[];
    ignore?: string[];
    dot?: boolean;
  }

  export type Paths = string | string[] | finder.Options | finder.Options[];
}

const isStringArray = (data: string[] | finder.Options[]): data is string[] => {
  return typeof data[0] === 'string';
};

const flat = (matches: string[][]): string[] => {
  switch (matches.length) {
    case 0:
      return [];
    case 1:
      return matches[0]!;
    default:
      return [...new Set(matches.flat())];
  }
};

export const finder = (paths: finder.Paths): Promise<string[]> => {
  const opts = finder.normalize(paths);

  return Promise.all(
    opts.map((opt) => {
      const { dot, pattern: patterns } = opt;
      const options: glob.IOptions = {
        nodir: true,
        dot,
      };

      const ignore = opt.ignore ? opt.ignore.slice() : [];
      ignore.push('**/*.d.{ts,mts,cts}');
      options.ignore = ignore;

      return Promise.all(
        patterns.map(
          (pattern) =>
            new Promise<string[]>((resolve, reject) => {
              pattern = path.resolve(pattern);

              if (!glob.hasMagic(pattern)) {
                if (!existsSync(pattern)) {
                  return reject('no such file or directory: ' + pattern);
                }

                if (!statSync(pattern).isFile()) {
                  pattern = path.resolve(pattern, `./**/*.{${ext}}`);
                }
              }

              glob(
                pattern.split(path.sep).join('/'),
                options,
                (err, matches) => {
                  if (err === null) {
                    resolve(matches);
                  } else {
                    reject(err);
                  }
                },
              );
            }),
        ),
      ).then(flat);
    }),
  ).then(flat);
};

finder.normalize = (pattern: finder.Paths): finder.Options[] => {
  if (typeof pattern === 'string') {
    return [
      {
        pattern: [pattern],
      },
    ];
  }

  if (Array.isArray(pattern)) {
    if (!pattern.length) return [];

    return isStringArray(pattern)
      ? [
          {
            pattern: pattern,
          },
        ]
      : pattern;
  }

  return [pattern];
};
