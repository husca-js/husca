import {
  beforeEach,
  test,
  describe,
  afterEach,
  vitest,
  expect,
  SpyInstance,
  beforeAll,
} from 'vitest';
import chalk from 'chalk';
import request from 'supertest';
import { WebApp } from '@husca/husca';
import { server } from './server';
import { Transporter } from '../src';

let log: SpyInstance;
let transporter: Transporter;
let app: WebApp;
const transporterFunc = {
  blankFunc(..._args: any[]) {},
};

describe('logger', () => {
  beforeAll(() => {
    app = server();
  });

  beforeEach(() => {
    log = vitest.spyOn(console, 'log');
  });

  afterEach(() => {
    log.mockRestore();
  });

  test('should log a request', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect('hello world')
      .expect(() => {
        expect(log).toHaveBeenCalled();
      });
  });

  test('should log a request with correct method and url', async () => {
    await request(app.listen())
      .head('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenNthCalledWith(
          1,
          '  ' +
            chalk.gray('<--') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s'),
          'HEAD',
          '/200',
        );
      });
  });

  test('should log a response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenCalledTimes(2);
      });
  });

  test('should log a 200 response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.green('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/200',
          200,
          expect.any(String),
          '11b',
        );
      });
  });

  test('should log a 301 response', async () => {
    await request(app.listen())
      .get('/301')
      .expect(301)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/301',
          301,
          expect.any(String),
          '-',
        );
      });
  });

  test('should log a 304 response', async () => {
    await request(app.listen())
      .get('/304')
      .expect(304)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/304',
          304,
          expect.any(String),
          '',
        );
      });
  });

  test('should log a 404 response', async () => {
    await request(app.listen())
      .get('/404')
      .expect(404)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.yellow('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/404',
          404,
          expect.any(String),
          '9b',
        );
      });
  });

  test('should log a 500 response', async () => {
    await request(app.listen())
      .get('/500')
      .expect(500)
      .expect(() => {
        expect(log).to.toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500',
          500,
          expect.any(String),
          '12b',
        );
      });
  });

  test('should log middleware error', async () => {
    await request(app.listen())
      .get('/error')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/error',
          500,
          expect.any(String),
          '-',
        );
      });
  });

  test('should log a 500 response with boom', async () => {
    await request(app.listen())
      .get('/500-boom')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500-boom',
          500,
          expect.any(String),
          '-',
        );
      });
  });

  test('collect length for stream response', async () => {
    await request(app.listen())
      .get('/stream')
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/stream',
          200,
          expect.any(String),
          '9b',
        );
      });
  });
});

describe('logger-transporter-direct', () => {
  beforeAll(() => {
    transporter = function (string, args) {
      transporterFunc.blankFunc(string, args);
    };

    app = server(transporter);
  });

  beforeEach(() => {
    log = vitest.spyOn(transporterFunc, 'blankFunc');
  });

  afterEach(() => {
    log.mockRestore();
  });

  test('should log a request', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect('hello world')
      .expect(() => {
        expect(log).toHaveBeenCalled();
      });
  });

  test('should log a request with correct method and url', async () => {
    await request(app.listen())
      .head('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenNthCalledWith(1, expect.any(String), [
          '  ' +
            chalk.gray('<--') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s'),
          'HEAD',
          '/200',
        ]);
      });
  });

  test('should log a response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenCalledTimes(2);
      });
  });

  test('should log a 200 response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.green('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/200',
          200,
          expect.any(String),
          '11b',
        ]);
      });
  });

  test('should log a 301 response', async () => {
    await request(app.listen())
      .get('/301')
      .expect(301)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/301',
          301,
          expect.any(String),
          '-',
        ]);
      });
  });

  test('should log a 304 response', async () => {
    await request(app.listen())
      .get('/304')
      .expect(304)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/304',
          304,
          expect.any(String),
          '',
        ]);
      });
  });

  test('should log a 404 response', async () => {
    await request(app.listen())
      .get('/404')
      .expect(404)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.yellow('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/404',
          404,
          expect.any(String),
          '9b',
        ]);
      });
  });

  test('should log a 500 response', async () => {
    await request(app.listen())
      .get('/500')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500',
          500,
          expect.any(String),
          '12b',
        ]);
      });
  });

  test('should log middleware error', async () => {
    await request(app.listen())
      .get('/error')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/error',
          500,
          expect.any(String),
          '-',
        ]);
      });
  });

  test('should log a 500 response with boom', async () => {
    await request(app.listen())
      .get('/500-boom')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500-boom',
          500,
          expect.any(String),
          '-',
        ]);
      });
  });
});

describe('logger-transporter-opts', () => {
  beforeAll(() => {
    transporter = function (string, args) {
      transporterFunc.blankFunc(string, args);
    };

    app = server({ transporter });
  });

  beforeEach(() => {
    log = vitest.spyOn(transporterFunc, 'blankFunc');
  });

  afterEach(() => {
    log.mockRestore();
  });

  test('should log a request', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect('hello world')
      .expect(() => {
        expect(log).toHaveBeenCalled();
      });
  });

  test('should log a request with correct method and url', async () => {
    await request(app.listen())
      .head('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenNthCalledWith(1, expect.any(String), [
          '  ' +
            chalk.gray('<--') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s'),
          'HEAD',
          '/200',
        ]);
      });
  });

  test('should log a response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenCalledTimes(2);
      });
  });

  test('should log a 200 response', async () => {
    await request(app.listen())
      .get('/200')
      .expect(200)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.green('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/200',
          200,
          expect.any(String),
          '11b',
        ]);
      });
  });

  test('should log a 301 response', async () => {
    await request(app.listen())
      .get('/301')
      .expect(301)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/301',
          301,
          expect.any(String),
          '-',
        ]);
      });
  });

  test('should log a 304 response', async () => {
    await request(app.listen())
      .get('/304')
      .expect(304)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.cyan('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/304',
          304,
          expect.any(String),
          '',
        ]);
      });
  });

  test('should log a 404 response', async () => {
    await request(app.listen())
      .get('/404')
      .expect(404)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.yellow('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/404',
          404,
          expect.any(String),
          '9b',
        ]);
      });
  });

  test('should log a 500 response', async () => {
    await request(app.listen())
      .get('/500')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.gray('-->') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500',
          500,
          expect.any(String),
          '12b',
        ]);
      });
  });

  test('should log middleware error', async () => {
    await request(app.listen())
      .get('/error')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/error',
          500,
          expect.any(String),
          '-',
        ]);
      });
  });

  test('should log a 500 response with boom', async () => {
    await request(app.listen())
      .get('/500-boom')
      .expect(500)
      .expect(() => {
        expect(log).toHaveBeenLastCalledWith(expect.any(String), [
          '  ' +
            chalk.red('xxx') +
            ' ' +
            chalk.bold('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.red('%s') +
            ' ' +
            chalk.gray('%s') +
            ' ' +
            chalk.gray('%s'),
          'GET',
          '/500-boom',
          500,
          expect.any(String),
          '-',
        ]);
      });
  });
});
