export class ValidatorError extends Error {
  constructor(msg: string, key: string, superKeys: string[]) {
    super(msg.replaceAll('{{label}}', `"${superKeys.concat(key).join('.')}"`));
  }
}
