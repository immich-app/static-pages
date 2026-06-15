import { compareEnums } from 'src/comparers/enum.comparer';
import { compareExtensions } from 'src/comparers/extension.comparer';
import { compareFunctions } from 'src/comparers/function.comparer';
import { compareOverrides } from 'src/comparers/override.comparer';
import { compareParameters } from 'src/comparers/parameter.comparer';
import { compareTables } from 'src/comparers/table.comparer';
import { BaseContext } from 'src/contexts/base-context';
import { compare, getSchemaItemChildrenIds, getSchemaItemId, topologicalSort } from 'src/helpers';
import { transformers } from 'src/transformers';
import { DatabaseSchema, SchemaDiff, SchemaDiffOptions, SchemaDiffResult, SchemaDiffToSqlOptions } from 'src/types';

/**
 * Compute the difference between two database schemas
 */
export const schemaDiff = (
  source: DatabaseSchema,
  target: DatabaseSchema,
  options: SchemaDiffOptions = {},
): SchemaDiffResult => {
  const ctx = new BaseContext(options);

  const items = [
    ...compare(source.parameters, target.parameters, options.parameters, compareParameters()),
    ...compare(source.extensions, target.extensions, options.extensions, compareExtensions()),
    ...compare(source.functions, target.functions, options.functions, compareFunctions()),
    ...compare(source.enums, target.enums, options.enums, compareEnums()),
    ...compare(source.tables, target.tables, options.tables, compareTables(options)),
    ...compare(source.overrides, target.overrides, options.overrides, compareOverrides()),
  ];

  const filteredItems = items.some((item) => item.type === 'TableDrop' && item.object.name === ctx.overrideTableName)
    ? // override table is being dropped, so ignore override changes
      items.filter((item) => item.type !== 'OverrideCreate' && item.type !== 'OverrideUpdate')
    : items;

  const orderedItems = topologicalSort(filteredItems, {
    getId: getSchemaItemId,
    getChildrenIds: (item) => getSchemaItemChildrenIds(ctx, item, items),
  });

  return {
    items: orderedItems,
    asSql: (diffOptions?: SchemaDiffToSqlOptions) => schemaDiffToSql(orderedItems, diffOptions),
    asHuman: () => schemaDiffToHuman(orderedItems),
  };
};

/**
 * Convert schema diffs into SQL statements
 */
export const schemaDiffToSql = (items: SchemaDiff[], options: SchemaDiffToSqlOptions = {}): string[] => {
  return items.flatMap((item) => asSql(item, options));
};

/**
 * Convert schema diff into human readable statements
 */
export const schemaDiffToHuman = (items: SchemaDiff[]): string[] => {
  return items.flatMap((item) => asHuman(item));
};

export const asSql = (item: SchemaDiff, options: SchemaDiffToSqlOptions): string[] => {
  const ctx = new BaseContext(options);
  for (const transform of transformers) {
    const results = transform(ctx, item);
    if (!results) {
      continue;
    }

    return asArray(results).map((result) => result + withComments(options.comments, item));
  }

  throw new Error(`Unhandled schema diff type: ${item.type}`);
};

export const asHuman = ({ object, type }: SchemaDiff): string => {
  switch (type) {
    case 'ExtensionCreate': {
      return `The extension "${object.name}" is missing and needs to be created`;
    }
    case 'ExtensionDrop': {
      return `The extension "${object.name}" exists but is no longer needed`;
    }
    case 'FunctionCreate': {
      return `The function "${object.name}" is missing and needs to be created`;
    }
    case 'FunctionDrop': {
      return `The function "${object.name}" exists but should be removed`;
    }
    case 'TableCreate': {
      return `The table "${object.name}" is missing and needs to be created`;
    }
    case 'TableDrop': {
      return `The table "${object.name}" exists but should be removed`;
    }
    case 'ColumnAdd': {
      return `The column "${object.tableName}"."${object.name}" is missing and needs to be created`;
    }
    case 'ColumnRename': {
      return `The column "${object.new.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
    }
    case 'ColumnAlter': {
      return `The column "${object.new.tableName}"."${object.new.name}" has changes that need to be applied ${JSON.stringify(
        object.changes,
      )}`;
    }
    case 'ColumnDrop': {
      return `The column "${object.tableName}"."${object.name}" exists but should be removed`;
    }
    case 'ConstraintAdd': {
      return `The constraint "${object.tableName}"."${object.name}" (${object.type}) is missing and needs to be created`;
    }
    case 'ConstraintRename': {
      return `The constraint "${object.old.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
    }
    case 'ConstraintDrop': {
      return `The constraint "${object.tableName}"."${object.name}" exists but should be removed`;
    }
    case 'IndexCreate': {
      return `The index "${object.tableName}"."${object.name}" is missing and needs to be created`;
    }
    case 'IndexRename': {
      return `The index "${object.old.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
    }
    case 'IndexDrop': {
      return `The index "${object.name}" exists but is no longer needed`;
    }
    case 'TriggerCreate': {
      return `The trigger "${object.tableName}"."${object.name}" is missing and needs to be created`;
    }
    case 'TriggerDrop': {
      return `The trigger "${object.tableName}"."${object.name}" exists but is no longer needed`;
    }
    case 'ParameterSet': {
      return `The configuration parameter "${object.name}" has a different value and needs to be updated to "${object.value}"`;
    }
    case 'ParameterReset': {
      return `The configuration parameter "${object.name}" is set, but should be reset to the default value`;
    }
    case 'EnumCreate': {
      return `The enum "${object.name}" is missing and needs to be created`;
    }
    case 'EnumDrop': {
      return `The enum "${object.name}" exists but is no longer needed`;
    }
    case 'OverrideCreate': {
      return `The override "${object.name}" is missing and needs to be created`;
    }
    case 'OverrideUpdate': {
      return `The override "${object.name}" needs to be updated`;
    }
    case 'OverrideDrop': {
      return `The override "${object.name}" exists but is no longer needed`;
    }
  }
};

const withComments = (comments: boolean | undefined, item: SchemaDiff): string => {
  if (!comments) {
    return '';
  }

  return ` -- ${item.reason}`;
};

const asArray = <T>(items: T | T[]): T[] => {
  if (Array.isArray(items)) {
    return items;
  }

  return [items];
};
