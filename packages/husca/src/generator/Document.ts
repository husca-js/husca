interface DocumentType<T extends string> {
  key: string;
  type: T;
}

interface DocumentNumberType extends DocumentType<'number'> {
  value: number;
}

interface DocumentStringType extends DocumentType<'string'> {
  value: string;
}

interface DocumentObjectType extends DocumentType<'object'> {
  properties: object;
}

export class Document {
  constructor(
    protected readonly options:
      | DocumentNumberType
      | DocumentStringType
      | DocumentObjectType,
  ) {}
}
