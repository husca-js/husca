import { ConsoleApp } from './ConsoleApp';
import { ConsoleRequest } from './ConsoleRequest';
import { ConsoleResponse } from './ConsoleResponse';

export type ConsoleCtx<Props extends object = object> = ConsoleContext & Props;

export class ConsoleContext {
  constructor(
    public readonly app: ConsoleApp,
    public readonly request: ConsoleRequest,
    public readonly response: ConsoleResponse,
  ) {}
}
