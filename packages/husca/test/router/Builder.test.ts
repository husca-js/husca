import { describe, expect, test } from 'vitest';
import {
  ConsoleCtx,
  ConsoleSlot,
  createSlot,
  manageSlots,
  WebCtx,
  WebSlot,
} from '../../src';
import { Builder, CommanderBuilder, RouterBuilder } from '../../src/router';

describe('web router builder', () => {
  test('load slot', () => {
    const builder = new RouterBuilder('/', [], []);

    expect(Builder.getSlots(builder)).toHaveLength(0);
    builder
      .load(createSlot('web', () => {})) // 1
      .load(createSlot('mixed', () => {})) // 2
      .load(manageSlots('mixed'))
      .load(manageSlots('web').load(createSlot('web', () => {}))) // 3
      // @ts-expect-error
      .load(manageSlots('console'))
      // @ts-expect-error
      .load(createSlot('console', () => {})); // 4
    expect(Builder.getSlots(builder)).toHaveLength(4);
  });

  test('action is also a slot', () => {
    const builder = new RouterBuilder('/', [], []);
    const action = (_ctx: WebCtx) => {};

    builder
      .load(createSlot('web', () => {}))
      .action(action)
      .load(createSlot('web', () => {}));

    const slots = Builder.getSlots(builder);
    const actionSlot = slots[1]!;
    expect(slots).toHaveLength(3);
    expect(actionSlot).toBeInstanceOf(WebSlot);
  });

  test('match path and method', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student', '/teacher'],
      ['GET', 'HEAD'],
    );

    [
      ['/api/student', 'GET'],
      ['/api/student', 'HEAD'],
      ['/api/teacher', 'GET'],
      ['/api/teacher', 'HEAD'],
    ].forEach(([pathname, method]) => {
      expect(RouterBuilder.match(builder, pathname!, method!)).toMatchObject(
        {},
      );
      expect(
        RouterBuilder.match(builder, pathname!.toUpperCase(), method!),
      ).toMatchObject({});
    });

    [
      ['/api/student', 'get'],
      ['api/student', 'GET'],
      ['/api/student1', 'GET'],
      ['/api/student2', 'HEAD'],
      ['/teacher', 'GET'],
      ['/api/teacher', 'POST'],
    ].forEach(([pathname, method]) => {
      expect(RouterBuilder.match(builder, pathname!, method!)).toBeFalsy();
    });
  });

  test('match path and method with params', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student/:sid', '/teacher/:tid/:gid/suffix'],
      ['GET', 'HEAD'],
    );

    [
      <const>['/api/student/2', 'GET', { sid: '2' }],
      <const>['/api/student/5', 'HEAD', { sid: '5' }],
      <const>['/api/teacher/10/20/suffix', 'GET', { tid: '10', gid: '20' }],
      <const>['/api/teacher/3/5/suffix', 'HEAD', { tid: '3', gid: '5' }],
    ].forEach(([pathname, method, params]) => {
      expect(RouterBuilder.match(builder, pathname!, method!)).toMatchObject(
        params,
      );
      expect(
        RouterBuilder.match(builder, pathname!.toUpperCase(), method!),
      ).toMatchObject(params);
    });

    [
      ['/api/student/2/a', 'GET'],
      ['/api/student', 'HEAD'],
      ['/api/teacher/suffix', 'GET'],
      ['/api/teacher/3/6/suffixt', 'HEAD'],
      ['/api/teacher/3/7/mmfixt', 'HEAD'],
      ['/api/teacher/3/14/suffix', 'POST'],
    ].forEach(([pathname, method]) => {
      expect(RouterBuilder.match(builder, pathname!, method!)).toBeFalsy();
    });
  });

  test('match pathname only', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student/:sid', '/teacher/:tid/:gid/suffix', '/student', '/teacher'],
      [],
    );

    [
      '/api/teacher',
      '/api/student',
      '/api/student/3',
      '/api/teacher/1/2/suffix',
    ].forEach((pathname) => {
      expect(RouterBuilder.matchPathname(builder, pathname!)).toBeTruthy();
    });

    [
      '/api/teacher1',
      '/api/student3',
      '/api/student/3/a',
      '/api/teacher/1/suffix',
    ].forEach((pathname) => {
      expect(RouterBuilder.matchPathname(builder, pathname!)).toBeFalsy();
    });
  });

  test('action has no next parameter', () => {
    const builder = new RouterBuilder('/', [], []);

    builder.action(() => {});
    builder.action((_ctx) => {});
    // @ts-expect-error
    builder.action((_ctx, _next) => {});
  });

  test('prefix + uri', () => {
    [
      ['/', '/user', '/user'],
      ['/api', '/user', '/api/user'],
      ['', '/user', '/user'],
      ['', 'user', '/user'],
      ['/api', '/user/:id//books', '/api/user/:id/books'],
      ['////api///', '/user///', '/api/user'],
      ['/api', 'user', '/apiuser'],
      ['api', 'user', '/apiuser'],
    ].forEach(([a, b, c]) => {
      const builder = new RouterBuilder(a!, [b!], []);
      expect(builder['uris']).toMatchObject([c]);
    });
  });
});

describe('console commander builder', () => {
  test('load slot', () => {
    const builder = new CommanderBuilder('/', []);

    expect(Builder.getSlots(builder)).toHaveLength(0);
    builder
      .load(createSlot('console', () => {})) // 1
      .load(createSlot('mixed', () => {})) // 2
      .load(manageSlots('mixed'))
      .load(manageSlots('console').load(createSlot('console', () => {}))) // 3
      // @ts-expect-error
      .load(manageSlots('web'))
      // @ts-expect-error
      .load(createSlot('web', () => {})); // 4
    expect(Builder.getSlots(builder)).toHaveLength(4);
  });

  test('action is also a slot', () => {
    const builder = new CommanderBuilder('/', []);
    const action = (_ctx: ConsoleCtx) => {};

    builder
      .load(createSlot('console', () => {}))
      .action(action)
      .load(createSlot('console', () => {}));

    const slots = Builder.getSlots(builder);
    const actionSlot = slots[1]!;
    expect(slots).toHaveLength(3);
    expect(actionSlot).toBeInstanceOf(ConsoleSlot);
  });

  test('match command', () => {
    const builder = new CommanderBuilder('api', [
      ':for:student',
      ':for:teacher',
    ]);

    ['api:for:teacher', 'api:for:student'].forEach((command) => {
      expect(CommanderBuilder.match(builder, command!)).toBeTruthy();
    });

    ['api/for/teacher', 'api:for:students', 'student'].forEach((command) => {
      expect(CommanderBuilder.match(builder, command!)).toBeFalsy();
    });
  });

  test('action has no next parameter', () => {
    const builder = new CommanderBuilder('/', []);

    builder.action(() => {});
    builder.action((_ctx) => {});
    // @ts-expect-error
    builder.action((_ctx, _next) => {});
  });
});
