import { BaseContext } from 'src/contexts/base-context.js';
import { SchemaDiff } from 'src/types.js';

export type SqlTransformer = (ctx: BaseContext, item: SchemaDiff) => string | string[] | false;
