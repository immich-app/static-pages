import { DefaultNamingStrategy } from 'src/naming/default.naming';
import { NamingInterface, NamingItem } from 'src/naming/naming.interface';
import {
  BaseContextOptions,
  DatabaseEnum,
  DatabaseExtension,
  DatabaseFunction,
  DatabaseOverride,
  DatabaseParameter,
  DatabaseSchema,
  DatabaseTable,
  OutputTarget,
  UuidFunctionFactory,
} from 'src/types';

const asOverrideKey = (type: string, name: string) => `${type}:${name}`;

const isNamingInterface = (strategy: string | NamingInterface): strategy is NamingInterface => {
  return typeof strategy === 'object' && typeof strategy.getName === 'function';
};

const asNamingStrategy = (strategy: 'default' | NamingInterface): NamingInterface => {
  if (isNamingInterface(strategy)) {
    return strategy;
  }

  return new DefaultNamingStrategy();
};

const asUuidFunctionStrategy = (uuidFunction: string | UuidFunctionFactory): UuidFunctionFactory => {
  return typeof uuidFunction === 'string' ? () => uuidFunction : uuidFunction;
};

const defaultUuidFunction: UuidFunctionFactory = (version) => {
  return version === 4 ? 'uuidv4()' : 'uuidv7()';
};

export class BaseContext {
  databaseName: string;
  schemaName: string;
  overrideTableName: string;
  uuidFunctionFactory: UuidFunctionFactory;
  outputTarget: OutputTarget;

  tables: DatabaseTable[] = [];
  functions: DatabaseFunction[] = [];
  enums: DatabaseEnum[] = [];
  extensions: DatabaseExtension[] = [];
  parameters: DatabaseParameter[] = [];
  overrides: DatabaseOverride[] = [];
  warnings: string[] = [];

  private namingStrategy: NamingInterface;

  constructor(options: BaseContextOptions) {
    this.databaseName = options.databaseName ?? 'postgres';
    this.schemaName = options.schemaName ?? 'public';
    this.overrideTableName = options.overrideTableName ?? 'migration_overrides';
    this.namingStrategy = asNamingStrategy(options.namingStrategy ?? 'default');
    this.uuidFunctionFactory = asUuidFunctionStrategy(options.uuidFunction ?? defaultUuidFunction);
    this.outputTarget = options.outputTarget ?? 'javascript';
  }

  getNameFor(item: NamingItem) {
    return this.namingStrategy.getName(item);
  }

  getTableByName(name: string) {
    return this.tables.find((table) => table.name === name);
  }

  warn(context: string, message: string) {
    this.warnings.push(`[${context}] ${message}`);
  }

  build(): DatabaseSchema {
    const overrideMap = new Map<string, DatabaseOverride>();
    for (const override of this.overrides) {
      const { type, name } = override.value;
      overrideMap.set(asOverrideKey(type, name), override);
    }

    for (const func of this.functions) {
      func.override = overrideMap.get(asOverrideKey('function', func.name));
    }

    for (const { indexes, triggers } of this.tables) {
      for (const index of indexes) {
        index.override = overrideMap.get(asOverrideKey('index', index.name));
      }

      for (const trigger of triggers) {
        trigger.override = overrideMap.get(asOverrideKey('trigger', trigger.name));
      }
    }

    return {
      databaseName: this.databaseName,
      schemaName: this.schemaName,
      tables: this.tables,
      functions: this.functions,
      enums: this.enums,
      extensions: this.extensions,
      parameters: this.parameters,
      overrides: this.overrides,
      warnings: this.warnings,
    };
  }
}
