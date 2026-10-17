import { CheckOptions } from './decorators/check.decorator.js';
import { ConfigurationParameterOptions } from './decorators/configuration-parameter.decorator.js';
import { DatabaseOptions } from './decorators/database.decorator.js';
import { ExtensionOptions } from './decorators/extension.decorator.js';
import { ForeignKeyColumnOptions } from './decorators/foreign-key-column.decorator.js';
import { ForeignKeyConstraintOptions } from './decorators/foreign-key-constraint.decorator.js';
import { IndexOptions } from './decorators/index.decorator.js';
import { TableOptions } from './decorators/table.decorator.js';
import { TriggerOptions } from './decorators/trigger.decorator.js';
import { UniqueOptions } from './decorators/unique.decorator.js';
import { InternalColumnOptions } from './internal.js';
import { DatabaseEnum, DatabaseFunction } from './types.js';
export type ClassBased<T> = {
    object: Function;
} & T;
export type PropertyBased<T> = {
    object: object;
    propertyName: string | symbol;
} & T;
export type RegisterItem = {
    type: 'database';
    item: ClassBased<{
        options: DatabaseOptions;
    }>;
} | {
    type: 'table';
    item: ClassBased<{
        options: TableOptions;
    }>;
} | {
    type: 'index';
    item: ClassBased<{
        options: IndexOptions;
    }>;
} | {
    type: 'uniqueConstraint';
    item: ClassBased<{
        options: UniqueOptions;
    }>;
} | {
    type: 'checkConstraint';
    item: ClassBased<{
        options: CheckOptions;
    }>;
} | {
    type: 'column';
    item: PropertyBased<{
        options: InternalColumnOptions;
    }>;
} | {
    type: 'function';
    item: DatabaseFunction;
} | {
    type: 'enum';
    item: DatabaseEnum;
} | {
    type: 'trigger';
    item: ClassBased<{
        options: TriggerOptions;
    }>;
} | {
    type: 'extension';
    item: ClassBased<{
        options: ExtensionOptions;
    }>;
} | {
    type: 'configurationParameter';
    item: ClassBased<{
        options: ConfigurationParameterOptions;
    }>;
} | {
    type: 'foreignKeyColumn';
    item: PropertyBased<{
        options: ForeignKeyColumnOptions;
        target: () => Function;
    }>;
} | {
    type: 'foreignKeyConstraint';
    item: ClassBased<{
        options: ForeignKeyConstraintOptions;
    }>;
};
export type RegisterItemType<T extends RegisterItem['type']> = Extract<RegisterItem, {
    type: T;
}>['item'];
