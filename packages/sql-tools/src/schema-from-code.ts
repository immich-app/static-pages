import { ProcessorContext } from 'src/contexts/processor-context';
import { processors } from 'src/processors';
import { getRegisteredItems, resetRegisteredItems } from 'src/register';
import { ConstraintType, SchemaFromCodeOptions } from 'src/types';

/**
 * Load schema from code (decorators, etc)
 */
export const schemaFromCode = (options: SchemaFromCodeOptions = {}) => {
  try {
    const ctx = new ProcessorContext(options);
    const items = getRegisteredItems();

    for (const processor of processors) {
      processor(ctx, items);
    }

    if (ctx.options.overrides && ctx.overrides.length > 0) {
      ctx.tables.push({
        name: ctx.overrideTableName,
        columns: [
          {
            name: 'name',
            tableName: ctx.overrideTableName,
            primary: true,
            type: 'character varying',
            nullable: false,
            isArray: false,
            synchronize: true,
          },
          {
            name: 'value',
            tableName: ctx.overrideTableName,
            primary: false,
            type: 'jsonb',
            nullable: false,
            isArray: false,
            synchronize: true,
          },
        ],
        indexes: [],
        triggers: [],
        constraints: [
          {
            type: ConstraintType.PRIMARY_KEY,
            name: `${ctx.overrideTableName}_pkey`,
            tableName: ctx.overrideTableName,
            columnNames: ['name'],
            synchronize: true,
          },
        ],
        synchronize: true,
      });
    }

    return ctx.build();
  } finally {
    if (options.reset) {
      resetRegisteredItems();
    }
  }
};
