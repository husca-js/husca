import { ConsoleApp } from './ConsoleApp';

export class ConsoleResponse {
  public commandMatched: boolean = false;

  constructor(public readonly app: ConsoleApp) {}
}
