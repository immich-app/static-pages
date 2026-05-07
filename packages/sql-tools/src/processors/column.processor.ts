import { ColumnOptions } from 'src/decorators/column.decorator';
import { fromColumnValue } from 'src/helpers';
import { Processor } from 'src/types';

export const processColumns: Processor = (ctx, items) => {
  for (const {
    type,
    item: { object, propertyName, options },
  } of items.filter((item) => item.type === 'column' || item.type === 'foreignKeyColumn')) {
    const table = ctx.getTableByObject(object.constructor);
    if (!table) {
      return ctx.onMissingTable(type === 'column' ? '@Column' : '@ForeignKeyColumn', object, propertyName);
    }

    const columnName = options.name ?? ctx.getNameFor({ type: 'column', name: String(propertyName) });
    const existingColumn = table.columns.find((column) => column.name === columnName);
    if (existingColumn) {
      // TODO log warnings if column name is not unique
      continue;
    }

    if ('strategy' in options) {
      switch (options.strategy) {
        // auto uuid based on database type
        case 'uuid': {
          options.type = 'uuid';
          options.default = () => ctx.uuidFunctionFactory();
          break;
        }

        case 'uuid-v4': {
          options.type = 'uuid';
          options.default = () => ctx.uuidFunctionFactory(4);
          break;
        }

        case 'uuid-v7': {
          options.type = 'uuid';
          options.default = () => ctx.uuidFunctionFactory(7);
          break;
        }

        case 'identity': {
          options.identity = true;
          options.type = 'integer';
          break;
        }

        default: {
          throw new Error(`Unsupported generated column strategy ${options.strategy}`);
        }
      }
    }

    let defaultValue = fromColumnValue(options.default);
    let nullable = options.nullable ?? false;

    // map `{ default: null }` to `{ nullable: true }`
    if (defaultValue === null) {
      nullable = true;
      defaultValue = undefined;
    }

    const isEnum = !!(options as ColumnOptions).enum;

    ctx.addColumn(
      table,
      {
        name: columnName,
        tableName: table.name,
        primary: options.primary ?? false,
        default: defaultValue,
        nullable,
        isArray: (options as ColumnOptions).array ?? false,
        length: options.length,
        type: isEnum ? 'enum' : options.type || 'character varying',
        enumName: isEnum ? (options as ColumnOptions).enum!.name : undefined,
        comment: options.comment,
        storage: options.storage,
        identity: options.identity,
        synchronize: options.synchronize ?? true,
      },
      propertyName,
    );
  }
};
