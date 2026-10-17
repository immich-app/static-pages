import { BaseContext } from '../contexts/base-context.js';
import { SchemaDiff } from '../types.js';
export type SqlTransformer = (ctx: BaseContext, item: SchemaDiff) => string | string[] | false;
