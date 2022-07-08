import parser from 'yargs-parser';
import { ConsoleApp } from './ConsoleApp';

export class ConsoleRequest {
  public readonly options: Record<string, unknown>;
  public readonly command: string;

  constructor(public readonly app: ConsoleApp, public readonly argv: string[]) {
    const { _: commands, ...options } = parser(argv);

    this.options = options;
    this.command = String(commands[0] || '');
  }
}
