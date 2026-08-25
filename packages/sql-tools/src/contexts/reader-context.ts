import { BaseContext } from 'src/contexts/base-context.js';
import { SchemaFromDatabaseOptions } from 'src/types.js';

export class ReaderContext extends BaseContext {
  constructor(public options: SchemaFromDatabaseOptions) {
    super(options);
  }
}
