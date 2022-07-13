import request from 'supertest';
import { describe, test } from 'vitest';
import {
  createSlot,
  manageSlots,
  WebApp,
  WebCtx,
  WebUnlessOptions,
} from '../../src';

runWebTests('with PATH match exception', [
  // 404 scenarios
  { path: ['/foo'], testSample: '/foo', expected: 404 },
  { path: ['/bar'], testSample: '/bar', expected: 404 },
  { path: ['/bar', '/foo'], testSample: '/bar', expected: 404 },
  { path: ['/bar', '/foo'], testSample: '/foo', expected: 404 },
  { path: ['/bar', '/etc', '/foo'], testSample: '/foo', expected: 404 },
  { path: ['/bar', '/etc', '/foo'], testSample: '/etc', expected: 404 },
  // 200 scenarios
  { path: ['/foo'], testSample: '/else', expected: 200 },
  { path: ['/bar'], testSample: '/foo', expected: 200 },
  { path: ['/bar', '/foo'], testSample: '/etc', expected: 200 },
  { path: ['/bar', '/foo'], testSample: '/cool', expected: 200 },
  { path: ['/bar', '/etc', '/foo'], testSample: '/help', expected: 200 },
  { path: ['/bar', '/etc', '/foo'], testSample: '/twohundred', expected: 200 },
]);
runWebTests('with PATH (regexp) exception', [
  // 404 scenarios
  { path: [/er$/gi], testSample: '/slower', expected: 404 },
  { path: [/er$/gi], testSample: '/dummier', expected: 404 },
  { path: [/er/gi], testSample: '/ernest', expected: 404 },
  { path: [/er/gi], testSample: '/jerk', expected: 404 },
  { path: ['/foo', /oa/gi], testSample: '/goal', expected: 404 },
  { path: ['/foo', /oa/gi, '/bar'], testSample: '/oauth', expected: 404 },
  { path: ['/foo', /oa$/gi], testSample: '/koa', expected: 404 },
  { path: [/oa$/gi, '/foo', '/etc'], testSample: '/etc', expected: 404 },
  { path: ['/foo', /oa$/gi], testSample: '/foo', expected: 404 },

  // 200 scenarios
  { path: [/er$/gi], testSample: '/shop', expected: 200 },
  { path: [/er$/gi], testSample: '/', expected: 200 },
  { path: [/er$/gi], testSample: '/ernest', expected: 200 },
  { path: [/er/gi], testSample: '/about', expected: 200 },
  { path: [/er/gi], testSample: '/help', expected: 200 },
  { path: ['/foo', /oa/gi], testSample: '/some-url?id=12', expected: 200 },
  { path: ['/foo', /oa$/gi], testSample: '/express', expected: 200 },
  { path: [/oa$/gi, '/foo', '/etc'], testSample: '/koala', expected: 200 },
  { path: [/oa$/gi, '/foo', '/etc'], testSample: '/etcetera', expected: 200 },
  { path: ['/foo', /oa$/gi], testSample: '/foorious', expected: 200 },
]);
runWebTests('with EXT exception', [
  // 404 scenarios
  {
    config: { ext: ['html', 'css'] },
    testSample: '/index.html',
    expected: 404,
  },
  {
    config: { ext: ['html', 'css'] },
    testSample: '/some-file.css',
    expected: 404,
  },
  {
    config: { ext: ['html', 'css'] },
    testSample: '/some-folder/some-file.css',
    expected: 404,
  },
  {
    config: { ext: ['js', 'png'] },
    testSample: '/some-file.png',
    expected: 404,
  },
  {
    config: { ext: ['js', 'png'] },
    testSample: '/some-folder/some-file.js',
    expected: 404,
  },

  // 200 scenarios
  {
    config: { ext: ['html', 'css'] },
    testSample: '/some-path?queryString=style.css',
    expected: 200,
  },
  {
    config: { ext: ['html', 'css'] },
    testSample: '/html-is-awesome',
    expected: 200,
  },
  { config: { ext: ['js', 'png'] }, testSample: '/i-like-png', expected: 200 },
  {
    config: { ext: ['js', 'png'] },
    testSample: '/some-folder/some-file.jsx',
    expected: 200,
  },
]);
runWebTests('with METHOD exception', [
  // 404 scenarios
  {
    config: { method: ['GET', 'OPTIONS'] },
    testMethod: 'get',
    testSample: '/index.html',
    expected: 404,
  },
  {
    config: { method: ['GET', 'OPTIONS'] },
    testMethod: 'options',
    testSample: '/any-url',
    expected: 404,
  },
  {
    config: { method: ['POST'] },
    testMethod: 'post',
    testSample: '/any-url?query-string=123',
    expected: 404,
  },

  // 200 scenarios
  {
    config: { method: ['GET', 'OPTIONS'] },
    testMethod: 'post',
    testSample: '/index.html',
    expected: 200,
  },
  {
    config: { method: ['GET', 'OPTIONS'] },
    testMethod: 'delete',
    testSample: '/any-url',
    expected: 200,
  },
  {
    config: { method: ['POST'] },
    testMethod: 'get',
    testSample: '/any-url?query-string=123',
    expected: 200,
  },
]);
runWebTests(
  'with custom exception',
  ((): Secnarios[] => {
    function denyGuard(ctx: WebCtx) {
      return ctx.request.url === '/index' || ctx.request.url!.length === 7;
    }

    function allowGuard(ctx: WebCtx) {
      return (
        ctx.request.url === '/a-url-that-doesnt-exist' ||
        ctx.request.url!.length < 0
      );
    }

    return [
      // 404 scenarios
      { config: denyGuard, testSample: '/index', expected: 404 },
      { config: denyGuard, testSample: '/7-char', expected: 404 },

      // 200 scenarios
      { config: allowGuard, testSample: '/index', expected: 200 },
      { config: allowGuard, testSample: '/7-char', expected: 200 },
    ];
  })(),
);

interface Secnarios {
  config?: WebUnlessOptions | WebUnlessOptions['custom'];
  testSample: string;
  expected: number;
  testMethod?: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options';
  path?: (string | RegExp)[];
}

function runWebTests(testName: string, scenarios: Secnarios[]) {
  const testSlot = createSlot((ctx) => {
    ctx.send({ executed: true });
  });

  describe(testName, function () {
    scenarios.forEach((scenario) => {
      let acceptDeny = scenario.expected == 200 ? 'accept' : 'deny';
      let config = scenario.config || {
        path: scenario.path,
      };
      let testMethod = scenario.testMethod || 'get';

      test(`should ${acceptDeny} access to ${scenario.testSample} when configured with: ${config}`, async () => {
        let app = new WebApp({
          routers: [],
          globalSlots: manageSlots().load(testSlot.unless(config)),
        });

        await request(app.listen())
          [testMethod](scenario.testSample)
          .expect(scenario.expected);
      });
    });
  });
}
