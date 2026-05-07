import { depthFirstSearch, Graph, hasCycle } from 'graph-data-structure';
import { createHash } from 'node:crypto';
import { BaseContext } from 'src/contexts/base-context';
import { ColumnValue } from 'src/decorators/column.decorator';
import {
  Comparer,
  ConstraintType,
  DatabaseColumn,
  DatabaseConstraint,
  DatabaseEnum,
  DatabaseForeignKeyConstraint,
  DatabaseFunction,
  DatabaseIndex,
  DatabaseOverride,
  DatabaseTable,
  DatabaseTrigger,
  IgnoreOptions,
  OutputTarget,
  SchemaDiff,
  SchemaItem,
} from 'src/types';

export const asOptions = <T extends { name?: string }>(options: string | T): T => {
  if (typeof options === 'string') {
    return { name: options } as T;
  }

  return options;
};

export const sha1 = (value: string) => createHash('sha1').update(value).digest('hex');

const escapeArrayValue = (value: unknown) => {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value !== 'string') {
    return value;
  }

  if (value.trim() !== value || value.trim().length === 0) {
    return `"${value}"`;
  }

  if (/[{},"\\]/.test(value)) {
    return `"${value.replaceAll('\\', String.raw`\\`).replaceAll('"', String.raw`\"`)}"`;
  }

  if (value.toLowerCase() === 'null') {
    return `"${value}"`;
  }

  return value;
};

export const fromColumnValue = (columnValue?: ColumnValue): string | undefined | null => {
  if (columnValue === undefined) {
    return;
  }

  if (typeof columnValue === 'function') {
    return columnValue() as string;
  }

  const value = columnValue;

  if (value === null) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (Array.isArray(value)) {
    return `'{${value.map((entry) => (Array.isArray(entry) ? fromColumnValue(entry)?.slice(1, -1) : escapeArrayValue(entry))).join(',')}}'`;
  }

  return `'${String(value)}'`;
};

export const setIsEqual = (source: Set<unknown>, target: Set<unknown>) =>
  source.size === target.size && [...source].every((x) => target.has(x));

export const haveEqualColumns = (sourceColumns?: string[], targetColumns?: string[]) => {
  sourceColumns = sourceColumns ?? [];
  targetColumns = targetColumns ?? [];

  if (sourceColumns.length !== targetColumns.length) {
    return false;
  }

  for (let i = 0; i < sourceColumns.length; i++) {
    if (sourceColumns[i] !== targetColumns[i]) {
      return false;
    }
  }

  return true;
};

export const haveEqualOverrides = <T extends { override?: DatabaseOverride }>(source: T, target: T) => {
  if (!source.override || !target.override) {
    return false;
  }

  const sourceValue = source.override.value;
  const targetValue = target.override.value;

  return sourceValue.name === targetValue.name && sourceValue.sql === targetValue.sql;
};

export const compare = <T extends { name: string; synchronize: boolean }>(
  sources: T[],
  targets: T[],
  options: IgnoreOptions | undefined,
  comparer: Comparer<T>,
) => {
  options = options || {};
  const sourceMap = Object.fromEntries(sources.map((table) => [table.name, table]));
  const targetMap = Object.fromEntries(targets.map((table) => [table.name, table]));
  const items: SchemaDiff[] = [];

  const keys = new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);
  const missingKeys = new Set<string>();
  const extraKeys = new Set<string>();

  // common keys
  for (const key of keys) {
    const source = sourceMap[key];
    const target = targetMap[key];

    if (isIgnored(source, target, options ?? true)) {
      continue;
    }

    if (isSynchronizeDisabled(source, target)) {
      continue;
    }

    if (source && !target) {
      missingKeys.add(key);
      continue;
    }

    if (!source && target) {
      extraKeys.add(key);
      continue;
    }

    if (
      haveEqualOverrides(
        source as unknown as { override?: DatabaseOverride },
        target as unknown as { override?: DatabaseOverride },
      )
    ) {
      continue;
    }

    items.push(...comparer.onCompare(source, target));
  }

  // renames
  if (comparer.getRenameKey && comparer.onRename) {
    const renameMap: Record<string, string> = {};
    for (const sourceKey of missingKeys) {
      const source = sourceMap[sourceKey];
      const renameKey = comparer.getRenameKey(source);
      renameMap[renameKey] = sourceKey;
    }

    for (const targetKey of extraKeys) {
      const target = targetMap[targetKey];
      const renameKey = comparer.getRenameKey(target);
      const sourceKey = renameMap[renameKey];
      if (!sourceKey) {
        continue;
      }

      const source = sourceMap[sourceKey];

      items.push(...comparer.onRename(source, target));

      missingKeys.delete(sourceKey);
      extraKeys.delete(targetKey);
    }
  }

  // missing
  for (const key of missingKeys) {
    items.push(...comparer.onMissing(sourceMap[key]));
  }

  // extra
  for (const key of extraKeys) {
    items.push(...comparer.onExtra(targetMap[key]));
  }

  return items;
};

const isIgnored = (
  source: { synchronize?: boolean } | undefined,
  target: { synchronize?: boolean } | undefined,
  options: IgnoreOptions,
) => {
  if (typeof options === 'boolean') {
    return !options;
  }
  return (options.ignoreExtra && !source) || (options.ignoreMissing && !target);
};

const isSynchronizeDisabled = (source?: { synchronize?: boolean }, target?: { synchronize?: boolean }) => {
  return source?.synchronize === false || target?.synchronize === false;
};

export const isDefaultEqual = (source: DatabaseColumn, target: DatabaseColumn) => {
  if (source.default === target.default) {
    return true;
  }

  if (source.default === undefined || target.default === undefined) {
    return false;
  }

  if (
    withTypeCast(source.default, getColumnType(source)) === target.default ||
    withTypeCast(target.default, getColumnType(target)) === source.default
  ) {
    return true;
  }

  return false;
};

export const getColumnType = (column: DatabaseColumn) => {
  let type = column.enumName || column.type;
  if (column.isArray) {
    type += `[${column.length ?? ''}]`;
  } else if (column.length !== undefined) {
    type += `(${column.length})`;
  }

  return type;
};

const withTypeCast = (value: string, type: string) => {
  if (!value.startsWith(`'`)) {
    value = `'${value}'`;
  }
  return `${value}::${type}`;
};

export const getColumnModifiers = (column: DatabaseColumn) => {
  const modifiers: string[] = [];

  if (!column.nullable) {
    modifiers.push('NOT NULL');
  }

  if (column.default) {
    modifiers.push(`DEFAULT ${column.default}`);
  }
  if (column.identity) {
    modifiers.push(`GENERATED ALWAYS AS IDENTITY`);
  }

  return modifiers.length === 0 ? '' : ' ' + modifiers.join(' ');
};

export const asColumnComment = (tableName: string, columnName: string, comment: string): string => {
  return `COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment}';`;
};

export const asColumnList = (columns: string[]) => columns.map((column) => `"${column}"`).join(', ');

export const asJsonString = (input: unknown, options: { outputTarget: OutputTarget }): string => {
  let value = JSON.stringify(input);

  value = options.outputTarget === 'javascript' ? `'${escape(value)}'` : `$json$${value}$json$`;

  return `${value}::jsonb`;
};

const escape = (value: string) => {
  return value
    .replaceAll("'", "''")
    .replaceAll(/[\\]/g, '\\\\')
    .replaceAll(/[\b]/g, String.raw`\b`)
    .replaceAll(/[\f]/g, String.raw`\f`)
    .replaceAll(/[\n]/g, String.raw`\n`)
    .replaceAll(/[\r]/g, String.raw`\r`)
    .replaceAll(/[\t]/g, String.raw`\t`);
};

export const asRenameKey = (values: Array<string | boolean | number | undefined>) =>
  values.map((value) => value ?? '').join('|');

export type NodeOptions<T> = {
  getId: (item: T) => string;
  getChildrenIds: (item: T) => Array<string | undefined>;
};

export const topologicalSort = <T>(items: T[], { getId, getChildrenIds }: NodeOptions<T>): T[] => {
  const graph = new Graph<string>();
  const itemMap = new Map<string, T>();

  for (const item of items) {
    const id = getId(item);
    graph.addNode(id);
    itemMap.set(id, item);
  }

  for (const item of items) {
    const id = getId(item);
    for (const childId of getChildrenIds(item)) {
      if (childId && itemMap.has(childId)) {
        graph.addEdge(id, childId);
      }
    }
  }

  if (hasCycle(graph)) {
    console.log('[Warning] Circular dependency detected in schema diff items');
  }

  return depthFirstSearch(graph).map((id) => itemMap.get(id)!);
};

export const getSchemaItemId = (item: SchemaItem): string => {
  switch (item.type) {
    case 'ExtensionCreate':
    case 'ExtensionDrop':
    case 'FunctionCreate':
    case 'FunctionDrop':
    case 'EnumCreate':
    case 'EnumDrop':
    case 'ParameterSet':
    case 'ParameterReset':
    case 'OverrideCreate':
    case 'OverrideUpdate':
    case 'OverrideDrop':
    case 'TableCreate':
    case 'TableDrop': {
      return `${item.type}:${item.object.name}`;
    }

    case 'ColumnAdd':
    case 'ColumnDrop':
    case 'ConstraintAdd':
    case 'ConstraintDrop':
    case 'IndexCreate':
    case 'IndexDrop':
    case 'TriggerCreate':
    case 'TriggerDrop': {
      return `${item.type}:${item.object.tableName}.${item.object.name}`;
    }

    case 'ColumnAlter':
    case 'ColumnRename':
    case 'ConstraintRename':
    case 'IndexRename': {
      return `${item.type}:${item.object.old.tableName}.${item.object.old.name}`;
    }
  }
};

type TableName = { name: string; tableName: string };
type Name = { name: string };

const tableCreate = (item: Name) => getSchemaItemId({ type: 'TableCreate', object: item as DatabaseTable });
const tableDrop = (item: Name) => getSchemaItemId({ type: 'TableDrop', object: item as DatabaseTable });
const constraintDrop = (item: TableName) =>
  getSchemaItemId({ type: 'ConstraintDrop', object: item as DatabaseConstraint });
const functionCreate = (item: Name) => getSchemaItemId({ type: 'FunctionCreate', object: item as DatabaseFunction });
const functionDrop = (item: Name) => getSchemaItemId({ type: 'FunctionDrop', object: item as DatabaseFunction });
const triggerDrop = (item: TableName) => getSchemaItemId({ type: 'TriggerDrop', object: item as DatabaseTrigger });
const enumCreate = (item: Name) => getSchemaItemId({ type: 'EnumCreate', object: item as DatabaseEnum });
const enumDrop = (item: Name) => getSchemaItemId({ type: 'EnumDrop', object: item as DatabaseEnum });
const indexDrop = (item: TableName) => getSchemaItemId({ type: 'IndexDrop', object: item as DatabaseIndex });
const columnCreate = (item: TableName) => getSchemaItemId({ type: 'ColumnAdd', object: item as DatabaseColumn });
const columnDrop = (item: TableName) => getSchemaItemId({ type: 'ColumnDrop', object: item as DatabaseColumn });
const overrideDrop = (item: Name) => getSchemaItemId({ type: 'OverrideDrop', object: item as DatabaseOverride });

export const getSchemaItemChildrenIds = (
  ctx: BaseContext,
  { type, object }: SchemaItem,
  items: SchemaItem[],
): Array<string | undefined> => {
  {
    switch (type) {
      case 'TriggerCreate': {
        return [
          triggerDrop(object),
          tableCreate({ name: object.tableName }),
          // create after referenced functions are created
          functionCreate({ name: object.functionName }),
        ];
      }

      case 'FunctionCreate': {
        return [functionDrop(object)];
      }

      case 'FunctionDrop': {
        return [
          // drop after referenced triggers are dropped
          ...items
            .filter((item) => item.type === 'TriggerDrop')
            .filter((item) => item.object.functionName === object.name)
            .map((item) => triggerDrop(item.object)),
        ];
      }

      case 'TableCreate': {
        return [
          // create after non-deferred FK referenced tables exist (deferred FKs are added via ConstraintAdd after both tables exist)
          ...object.constraints
            .filter((c): c is DatabaseForeignKeyConstraint => c.type === ConstraintType.FOREIGN_KEY && !c.deferred)
            .map((constraint) => tableCreate({ name: constraint.referenceTableName })),
          // create after referenced enums are created
          ...object.columns.map((column) => column.enumName && enumCreate({ name: column.enumName })),
        ];
      }

      case 'TableDrop': {
        return [
          // drop override table after all drop overrides
          ...(object.name === ctx.overrideTableName
            ? items.filter((item) => item.type === 'OverrideDrop').map((item) => overrideDrop(item.object))
            : []),

          // drop after my own constraints are dropped
          ...items
            .filter((item) => item.type === 'ConstraintDrop')
            .map((item) => item.object)
            .filter(
              (c): c is DatabaseForeignKeyConstraint => c.type === ConstraintType.FOREIGN_KEY && c.name === c.name,
            )
            .map((c) => constraintDrop({ name: c.name, tableName: c.tableName })),

          // drop after tables with FKs to this table are dropped
          ...items
            .filter((item) => item.type === 'TableDrop')
            .filter((item) =>
              item.object.constraints.some(
                (c): c is DatabaseForeignKeyConstraint =>
                  c.type === ConstraintType.FOREIGN_KEY && c.referenceTableName === object.name && !c.deferred,
              ),
            )
            .map((item) => tableDrop({ name: item.object.name })),

          // drop after constraints to this table are dropped
          ...items
            .filter((item) => item.type === 'ConstraintDrop')
            .map((item) => item.object)
            .filter(
              (c): c is DatabaseForeignKeyConstraint =>
                c.type === ConstraintType.FOREIGN_KEY && c.referenceTableName === object.name,
            )
            .map((c) => constraintDrop({ name: c.name, tableName: c.referenceTableName })),
        ];
      }

      case 'ColumnAdd': {
        return [columnDrop(object)];
      }

      case 'ColumnDrop': {
        return [tableCreate({ name: object.tableName })];
      }

      case 'ColumnAlter': {
        return [tableCreate({ name: object.new.tableName })];
      }

      case 'EnumCreate': {
        return [enumDrop(object)];
      }

      case 'EnumDrop': {
        return [
          // drop after tables with columns with this enum are dropped
          ...items
            .filter((item) => item.type === 'TableDrop')
            .filter((item) => item.object.columns.some((column) => column.enumName === object.name))
            .map((item) => tableDrop(item.object)),
        ];
      }

      case 'ConstraintAdd': {
        return [
          constraintDrop(object),
          tableCreate({ name: object.tableName }),
          object.type === ConstraintType.FOREIGN_KEY ? tableCreate({ name: object.referenceTableName }) : undefined,
        ];
      }

      case 'IndexCreate': {
        return [
          indexDrop(object),
          // depend on the table
          tableCreate({ name: object.tableName }),
          // depend on columns being created
          ...(object.columnNames ?? []).map((name) => columnCreate({ name, tableName: object.tableName })),
        ];
      }

      case 'IndexRename': {
        return [tableCreate({ name: object.old.tableName }), tableCreate({ name: object.new.tableName })];
      }

      case 'OverrideCreate':
      case 'OverrideUpdate': {
        return [tableCreate({ name: ctx.overrideTableName })];
      }

      default: {
        return [];
      }
    }
  }
};
