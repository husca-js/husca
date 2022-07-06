import yargs from 'yargs';
import { ConsoleApp } from './ConsoleApp';

export class ConsoleRequest {
  public readonly options: Record<string, unknown>;
  public readonly command: string;

  constructor(public readonly app: ConsoleApp, public readonly argv: string[]) {
    const {
      $0,
      _: commands,
      ...options
    } = yargs([]).help(false).version(false).parseSync(argv);

    this.options = options;
    this.command = String(commands[0] || '');
  }
}
