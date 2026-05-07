import { BaseContext } from 'src/contexts/base-context';
import { SchemaFromDatabaseOptions } from 'src/types';

export class ReaderContext extends BaseContext {
  constructor(public options: SchemaFromDatabaseOptions) {
    super(options);
  }
}
