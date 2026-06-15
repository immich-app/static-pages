/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { BaseContext } from 'src/contexts/base-context';
import { TableOptions } from 'src/decorators/table.decorator';
import { DatabaseColumn, DatabaseTable, SchemaFromCodeOptions } from 'src/types';

type TableMetadata = { options: TableOptions; object: Function; methodToColumn: Map<string | symbol, DatabaseColumn> };

export class ProcessorContext extends BaseContext {
  constructor(public options: SchemaFromCodeOptions) {
    options.createForeignKeyIndexes = options.createForeignKeyIndexes ?? true;
    options.overrides = options.overrides ?? false;
    super(options);
  }

  classToTable: WeakMap<Function, DatabaseTable> = new WeakMap();
  tableToMetadata: WeakMap<DatabaseTable, TableMetadata> = new WeakMap();

  getTableByObject(object: Function) {
    return this.classToTable.get(object);
  }

  getTableMetadata(table: DatabaseTable) {
    const metadata = this.tableToMetadata.get(table);
    if (!metadata) {
      throw new Error(`Table metadata not found for table: ${table.name}`);
    }
    return metadata;
  }

  addTable(table: DatabaseTable, options: TableOptions, object: Function) {
    this.tables.push(table);
    this.classToTable.set(object, table);
    this.tableToMetadata.set(table, { options, object, methodToColumn: new Map() });
  }

  getColumnByObjectAndPropertyName(
    object: object,
    propertyName: string | symbol,
  ): { table?: DatabaseTable; column?: DatabaseColumn } {
    const table = this.getTableByObject(object.constructor);
    if (!table) {
      return {};
    }

    const tableMetadata = this.tableToMetadata.get(table);
    if (!tableMetadata) {
      return {};
    }

    const column = tableMetadata.methodToColumn.get(propertyName);

    return { table, column };
  }

  addColumn(table: DatabaseTable, input: DatabaseColumn, propertyName: string | symbol) {
    const column = Object.fromEntries(
      Object.entries(input).filter(([_key, value]) => value !== undefined),
    ) as DatabaseColumn;
    table.columns.push(column);
    const tableMetadata = this.getTableMetadata(table);
    tableMetadata.methodToColumn.set(propertyName, column);
  }

  onMissingTable(context: string, name: string): never;
  onMissingTable(context: string, object: object, propertyName?: symbol | string): never;
  onMissingTable(context: string, objectOrName: object | string, propertyName?: symbol | string): never {
    const label =
      typeof objectOrName === 'string'
        ? objectOrName
        : objectOrName.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    throw new Error(`[${context}] Unable to find table (${label})`);
  }

  onMissingColumn(context: string, name: string): never;
  onMissingColumn(context: string, object: object, propertyName?: symbol | string): never;
  onMissingColumn(context: string, objectOrName: object | string, propertyName?: symbol | string): never {
    const label =
      typeof objectOrName === 'string'
        ? objectOrName
        : objectOrName.constructor.name + (propertyName ? '.' + String(propertyName) : '');
    throw new Error(`[${context}] Unable to find column (${label})`);
  }
}
