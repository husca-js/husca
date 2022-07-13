import { test, expect } from 'vitest';
import { rule, Validator } from '../../src';
import supertest from 'supertest';
import { IncomingMessage, ServerResponse } from 'http';
import formidable from 'formidable';
import path from 'path';

const parseFilesAndFields = (
  req: IncomingMessage,
): Promise<Record<string, any>> => {
  const form = formidable({
    hashAlgorithm: 'md5',
    keepExtensions: true,
    maxFileSize: 1000 * 1024 * 1024,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);

      resolve({
        ...fields,
        ...files,
      });
    });
  });
};

const createRequest = (validator: Validator) => {
  return supertest(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const files = await parseFilesAndFields(req);
      const result = await Validator.validate(validator, files, 'file1');

      res
        .setHeader('Content-Type', 'application/json')
        .end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = 400;
      res.end((e as Error).message);
    }
  });
};

test('empty boundaries', () => {
  const validator = rule.file();

  expect(Validator.isEmpty(validator, null)).toBeTruthy();
  expect(Validator.isEmpty(validator, undefined)).toBeTruthy();
  expect(Validator.isEmpty(validator, '')).toBeTruthy();

  expect(Validator.isEmpty(validator, '0')).toBeFalsy();
  expect(Validator.isEmpty(validator, 0)).toBeFalsy();
  expect(Validator.isEmpty(validator, NaN)).toBeFalsy();
  expect(Validator.isEmpty(validator, false)).toBeFalsy();
});

test('upload single file', async () => {
  const request = createRequest(rule.file());

  await request.post('/').expect(400, /required/);

  await request
    .post('/')
    .send({
      file1: 'hello',
    })
    .expect(400, /must be file/);

  await request
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
    .then((res) => {
      expect(res.body).toMatchObject({
        originalFilename: 'arrow.jpg',
        mimetype: 'image/jpeg',
        size: 209,
        hash: '70204d3a4999d42a7767ef188cea1333',
      });
    });

  await request
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
    .attach('file1', path.resolve('test/mocks/upload/arrow.png'))
    .expect(400, /single file/);
});

test('upload multiple files', async () => {
  const request = createRequest(rule.array(rule.file()));

  await request.post('/').expect(400, /required/);

  await request
    .post('/')
    .send({
      file1: 'hello',
    })
    .expect(400, /must be array/);

  await request
    .post('/')
    .send({
      file1: ['hello'],
    })
    .expect(400, /must be file/);

  await request
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
    .attach('file1', path.resolve('test/mocks/upload/arrow.png'))
    .then((res) => {
      expect(res.body).toMatchObject([
        {
          originalFilename: 'arrow.jpg',
          mimetype: 'image/jpeg',
          size: 209,
          hash: '70204d3a4999d42a7767ef188cea1333',
        },
        {
          originalFilename: 'arrow.png',
          mimetype: 'image/png',
          size: 209,
          hash: '70204d3a4999d42a7767ef188cea1333',
        },
      ]);
    });
});

test('set max size', async () => {
  const request = createRequest(rule.file().maxSize(200));

  await request
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
    .expect(400, /too large/);

  await request
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/hello.txt'))
    .expect(200);

  await createRequest(rule.file().maxSize(209))
    .post('/')
    .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
    .expect(200);
});

test('set allowed mime types', async () => {
  await Promise.all(
    [['.jpg', 'jpg', 'image/jpeg', 'hello.jpg']].map(async (ext) => {
      const request = createRequest(rule.file().mimeTypes(ext));

      await request
        .post('/')
        .attach('file1', path.resolve('test/mocks/upload/arrow.jpg'))
        .expect(200);

      await request
        .post('/')
        .attach('file1', path.resolve('test/mocks/upload/arrow.png'))
        .expect(400, /mime/);
    }),
  );
});
