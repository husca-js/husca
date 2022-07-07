import path from 'path';
import { expect, test } from 'vitest';
import { finder } from '../../src/utils/finder';

test('throw when input non-exists file or directory', async () => {
  await expect(finder('./test/mocks/non-exists.ts')).rejects.toThrowError(
    'no such file or directory',
  );

  await expect(finder('./test/mocks/non-exists-folder')).rejects.toThrowError(
    'no such file or directory',
  );
});

test('input exact file', async () => {
  const relativePath = './test/mocks/routers/router-empty.ts';
  const files = await finder(relativePath);
  expect(files).toHaveLength(1);
  expect(files[0]).toBe(path.resolve(relativePath));
});

test('input exact directory', async () => {
  [
    await finder('./test/mocks'),
    await finder({
      pattern: ['./test/mocks'],
    }),
  ].forEach((files) => {
    expect(files).toContain(path.resolve('./test/mocks/routers/router1-5.ts'));
    expect(files).toContain(path.resolve('./test/mocks/ip.ts'));

    ['js', 'ts', 'cjs', 'cts', 'mjs', 'mts'].forEach((ext) => {
      expect(files).toContain(path.resolve('./test/mocks/other-ext/x.' + ext));
    });

    expect(
      files.every((file) => file.endsWith('ts') || file.endsWith('js')),
    ).toBeTruthy();
  });
});

test('input magic pattern', async () => {
  const files = await finder('./test/mocks/**/*.jpg');

  expect(files).toHaveLength(1);
  expect(files[0]).toBe(path.resolve('./test/mocks/upload/arrow.jpg'));

  await expect(finder('./test/mocks/**/*.mmmjs')).resolves.toStrictEqual([]);
  await expect(finder('./test/mocks/**/*.other')).resolves.toStrictEqual([]);
});

test('strip duplicate files', async () => {
  const files = await finder([
    './test/mocks/**/*.jpg',
    './test/mocks/**/*.jpg',
    './test/mocks/**/*',
  ]);
  const jpg = path.resolve('./test/mocks/upload/arrow.jpg');

  expect(files.filter((file) => file === jpg)).toHaveLength(1);
});

test('ignore specific files', async () => {
  const files = await finder([
    {
      pattern: ['./test/mocks/**/*'],
      ignore: ['**/*.ts'],
    },
  ]);

  expect(files).toContain(path.resolve('./test/mocks/upload/arrow.jpg'));
  expect(files).toContain(path.resolve('./test/mocks/other-ext/x.mts'));
  expect(files.some((file) => file.endsWith('.ts'))).toBeFalsy();
});

test('empty files from empty folder', async () => {
  await expect(finder('./test/mocks/empty-folder')).resolves.toStrictEqual([]);
});

test('empty files when input empty array', async () => {
  await expect(finder([])).resolves.toStrictEqual([]);
});
