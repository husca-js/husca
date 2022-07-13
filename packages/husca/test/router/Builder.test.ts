import { describe, expect, test } from 'vitest';
import { ConsoleSlot, createSlot, manageSlots, WebSlot } from '../../src';
import { CommanderBuilder, RouterBuilder } from '../../src/router';
import { noop } from '../helpers/noop';

describe('web router builder', () => {
  test('load slot', () => {
    const builder = new RouterBuilder('/', [], [], {
      slots: [
        createSlot(noop),
        createSlot('mixed', noop),
        manageSlots('mixed'),
        manageSlots().load(createSlot(noop)).load(createSlot(noop)),
      ],
    });

    expect(builder.slots).toHaveLength(4);
  });

  test('action is also a slot', () => {
    const builder = new RouterBuilder('/', [], [], {
      slots: [createSlot(noop), createSlot(noop)],
      action: () => {},
    });

    expect(builder.slots).toHaveLength(3);
    expect(builder.slots[2]!).toBeInstanceOf(WebSlot);
  });

  test('match path and method', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student', '/teacher'],
      ['GET', 'HEAD'],
      {},
    );

    [
      ['/api/student', 'GET'],
      ['/api/student', 'HEAD'],
      ['/api/teacher', 'GET'],
      ['/api/teacher', 'HEAD'],
    ].forEach(([pathname, method]) => {
      expect(builder.match(pathname!, method!)).toMatchObject({});
      expect(builder.match(pathname!.toUpperCase(), method!)).toMatchObject({});
    });

    [
      ['/api/student', 'get'],
      ['api/student', 'GET'],
      ['/api/student1', 'GET'],
      ['/api/student2', 'HEAD'],
      ['/teacher', 'GET'],
      ['/api/teacher', 'POST'],
    ].forEach(([pathname, method]) => {
      expect(builder.match(pathname!, method!)).toBeFalsy();
    });
  });

  test('match path and method with params', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student/:sid', '/teacher/:tid/:gid/suffix'],
      ['GET', 'HEAD'],
      {},
    );

    [
      <const>['/api/student/2', 'GET', { sid: '2' }],
      <const>['/api/student/5', 'HEAD', { sid: '5' }],
      <const>['/api/teacher/10/20/suffix', 'GET', { tid: '10', gid: '20' }],
      <const>['/api/teacher/3/5/suffix', 'HEAD', { tid: '3', gid: '5' }],
    ].forEach(([pathname, method, params]) => {
      expect(builder.match(pathname!, method!)).toMatchObject(params);
      expect(builder.match(pathname!.toUpperCase(), method!)).toMatchObject(
        params,
      );
    });

    [
      ['/api/student/2/a', 'GET'],
      ['/api/student', 'HEAD'],
      ['/api/teacher/suffix', 'GET'],
      ['/api/teacher/3/6/suffixt', 'HEAD'],
      ['/api/teacher/3/7/mmfixt', 'HEAD'],
      ['/api/teacher/3/14/suffix', 'POST'],
    ].forEach(([pathname, method]) => {
      expect(builder.match(pathname!, method!)).toBeFalsy();
    });
  });

  test('match pathname only', () => {
    const builder = new RouterBuilder(
      '/api',
      ['/student/:sid', '/teacher/:tid/:gid/suffix', '/student', '/teacher'],
      [],
      {},
    );

    [
      '/api/teacher',
      '/api/student',
      '/api/student/3',
      '/api/teacher/1/2/suffix',
    ].forEach((pathname) => {
      expect(builder.matchPathname(pathname!)).toBeTruthy();
    });

    [
      '/api/teacher1',
      '/api/student3',
      '/api/student/3/a',
      '/api/teacher/1/suffix',
    ].forEach((pathname) => {
      expect(builder.matchPathname(pathname!)).toBeFalsy();
    });
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
      const builder = new RouterBuilder(a!, [b!], [], {});
      expect(builder['uris']).toMatchObject([c]);
    });
  });
});

describe('console commander builder', () => {
  test('load slot', () => {
    const builder = new CommanderBuilder('/', [], {
      slots: [
        createSlot('console', noop),
        createSlot('mixed', noop),
        manageSlots('mixed'),
        manageSlots('console')
          .load(createSlot('console', noop))
          .load(createSlot('console', noop)),
      ],
    });

    expect(builder.slots).toHaveLength(4);
  });

  test('action is also a slot', () => {
    const builder = new CommanderBuilder('/', [], {
      slots: [createSlot('console', noop), createSlot('console', noop)],
      action: noop,
    });

    expect(builder.slots).toHaveLength(3);
    expect(builder.slots[2]).toBeInstanceOf(ConsoleSlot);
  });

  test('match command', () => {
    const builder = new CommanderBuilder(
      'api',
      [':for:student', ':for:teacher'],
      {},
    );

    ['api:for:teacher', 'api:for:student'].forEach((command) => {
      expect(builder.match(command!)).toBeTruthy();
    });

    ['api/for/teacher', 'api:for:students', 'student'].forEach((command) => {
      expect(builder.match(command!)).toBeFalsy();
    });
  });
});
