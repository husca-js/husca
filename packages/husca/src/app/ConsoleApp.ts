import { EOL } from 'node:os';
import util from 'node:util';
import chalk from 'chalk';
import { Commander, CommanderParser, BaseRouterParser } from '../router';
import { ConsoleSlotManager } from '../slot';
import { composeToMiddleware } from '../utils/compose';
import { BaseApp } from './BaseApp';
import { ConsoleContext } from './ConsoleContext';
import { ConsoleRequest } from './ConsoleRequest';
import { ConsoleResponse } from './ConsoleResponse';

export interface ConsoleAppOptions {
  readonly commanders?: string[];
  argv?: () => string[];
  readonly globalSlots?: ConsoleSlotManager;
}

export class ConsoleApp extends BaseApp {
  protected readonly getArgv: () => string[];

  constructor(options: ConsoleAppOptions = {}) {
    super({
      globSlots: options.globalSlots,
      paths: options.commanders || [],
    });
    this.getArgv = options.argv || (() => process.argv.slice(2));
  }

  public async run(): Promise<boolean> {
    await this.ready();

    const request = new ConsoleRequest(this, this.getArgv());
    const response = new ConsoleResponse(this);
    const ctx = new ConsoleContext(this, request, response);

    if (!this.listenerCount('error')) {
      this.on('error', this.log);
    }

    try {
      await composeToMiddleware(this.middleware)(ctx, Promise.resolve);
      if (!response.commandMatched) {
        throw new Error(`No command matches "${request.command}"`);
      }
    } catch (e) {
      this.emit('error', e);
      return false;
    }

    return true;
  }

  public mountCommander(commanders: Commander | Commander[]): void {
    return this.mountRouter(commanders);
  }

  public log(err: Error) {
    if (!(err instanceof Error)) {
      err = new TypeError(util.format('non-error thrown: %j', err));
    }

    const msgs = (err.stack || err.toString())
      .split(EOL)
      .map((item) => '  ' + item);

    console.error();
    console.error(chalk.red(msgs.shift()));
    console.error(msgs.join(EOL));
    console.error();
  }

  protected createRouterParser(): BaseRouterParser {
    return new CommanderParser(this.preSlotID, this.routerSlots);
  }
}
