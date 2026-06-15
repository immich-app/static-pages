import { BaseContext } from 'src/contexts/base-context';
import { SchemaDiff } from 'src/types';

export type SqlTransformer = (ctx: BaseContext, item: SchemaDiff) => string | string[] | false;
