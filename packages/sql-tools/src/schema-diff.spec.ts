import { schemaDiff } from 'src/schema-diff';
import {
  ActionType,
  ColumnType,
  ConstraintType,
  DatabaseColumn,
  DatabaseConstraint,
  DatabaseIndex,
  DatabaseSchema,
  DatabaseTable,
} from 'src/types';
import { describe, expect, it } from 'vitest';

const fromColumn = (column: Partial<Omit<DatabaseColumn, 'tableName'>>): DatabaseSchema => {
  const tableName = 'table1';

  return {
    databaseName: 'postgres',
    schemaName: 'public',
    functions: [],
    enums: [],
    extensions: [],
    parameters: [],
    overrides: [],
    tables: [
      {
        name: tableName,
        columns: [
          {
            name: 'column1',
            primary: false,
            synchronize: true,
            isArray: false,
            type: 'character varying',
            nullable: false,
            ...column,
            tableName,
          },
        ],
        indexes: [],
        triggers: [],
        constraints: [],
        synchronize: true,
      },
    ],
    warnings: [],
  };
};

const fromConstraint = (constraint?: DatabaseConstraint): DatabaseSchema => {
  const tableName = constraint?.tableName || 'table1';

  return {
    databaseName: 'postgres',
    schemaName: 'public',
    functions: [],
    enums: [],
    extensions: [],
    parameters: [],
    overrides: [],
    tables: [
      {
        name: tableName,
        columns: [
          {
            name: 'column1',
            primary: false,
            synchronize: true,
            isArray: false,
            type: 'character varying',
            nullable: false,
            tableName,
          },
        ],
        indexes: [],
        triggers: [],
        constraints: constraint ? [constraint] : [],
        synchronize: true,
      },
    ],
    warnings: [],
  };
};

const fromIndex = (index?: DatabaseIndex): DatabaseSchema => {
  const tableName = index?.tableName || 'table1';

  return {
    databaseName: 'postgres',
    schemaName: 'public',
    functions: [],
    enums: [],
    extensions: [],
    parameters: [],
    overrides: [],
    tables: [
      {
        name: tableName,
        columns: [
          {
            name: 'column1',
            primary: false,
            synchronize: true,
            isArray: false,
            type: 'character varying',
            nullable: false,
            tableName,
          },
        ],
        indexes: index ? [index] : [],
        constraints: [],
        triggers: [],
        synchronize: true,
      },
    ],
    warnings: [],
  };
};

const newSchema = (schema: {
  name?: string;
  tables: Array<{
    name: string;
    columns?: Array<{
      name: string;
      type?: ColumnType;
      nullable?: boolean;
      isArray?: boolean;
    }>;
    indexes?: DatabaseIndex[];
    constraints?: DatabaseConstraint[];
  }>;
}): DatabaseSchema => {
  const tables: DatabaseTable[] = [];

  for (const table of schema.tables || []) {
    const tableName = table.name;
    const columns: DatabaseColumn[] = [];

    for (const column of table.columns || []) {
      const columnName = column.name;

      columns.push({
        tableName,
        name: columnName,
        primary: false,
        type: column.type || 'character varying',
        isArray: column.isArray ?? false,
        nullable: column.nullable ?? false,
        synchronize: true,
      });
    }

    tables.push({
      name: tableName,
      columns,
      indexes: table.indexes ?? [],
      constraints: table.constraints ?? [],
      triggers: [],
      synchronize: true,
    });
  }

  return {
    databaseName: 'immich',
    schemaName: schema?.name || 'public',
    functions: [],
    enums: [],
    extensions: [],
    parameters: [],
    overrides: [],
    tables,
    warnings: [],
  };
};

describe(schemaDiff.name, () => {
  it('should work', () => {
    const diff = schemaDiff(newSchema({ tables: [] }), newSchema({ tables: [] }));
    expect(diff.items).toEqual([]);
  });

  describe('table', () => {
    describe('TableCreate', () => {
      it('should find a missing table', () => {
        const column: DatabaseColumn = {
          type: 'character varying',
          tableName: 'table1',
          primary: false,
          name: 'column1',
          isArray: false,
          nullable: false,
          synchronize: true,
        };
        const diff = schemaDiff(
          newSchema({ tables: [{ name: 'table1', columns: [column] }] }),
          newSchema({ tables: [] }),
        );

        expect(diff.items).toHaveLength(1);
        expect(diff.items[0]).toEqual({
          type: 'TableCreate',
          object: {
            name: 'table1',
            columns: [column],
            constraints: [],
            indexes: [],
            triggers: [],
            synchronize: true,
          },
          reason: 'missing in target',
        });
      });
    });

    describe('TableDrop', () => {
      it('should find an extra table', () => {
        const diff = schemaDiff(
          newSchema({ tables: [] }),
          newSchema({
            tables: [{ name: 'table1', columns: [{ name: 'column1' }] }],
          }),
          { tables: { ignoreExtra: false } },
        );

        expect(diff.items).toHaveLength(1);
        expect(diff.items[0]).toEqual({
          type: 'TableDrop',
          object: expect.objectContaining({ name: 'table1' }),
          reason: 'missing in source',
        });
      });
    });

    it('should skip identical tables', () => {
      const diff = schemaDiff(
        newSchema({
          tables: [{ name: 'table1', columns: [{ name: 'column1' }] }],
        }),
        newSchema({
          tables: [{ name: 'table1', columns: [{ name: 'column1' }] }],
        }),
      );

      expect(diff.items).toEqual([]);
    });
  });

  describe('column', () => {
    describe('ColumnAdd', () => {
      it('should find a new column', () => {
        const diff = schemaDiff(
          newSchema({
            tables: [
              {
                name: 'table1',
                columns: [{ name: 'column1' }, { name: 'column2' }],
              },
            ],
          }),
          newSchema({
            tables: [{ name: 'table1', columns: [{ name: 'column1' }] }],
          }),
        );

        expect(diff.items).toEqual([
          {
            type: 'ColumnAdd',
            object: {
              tableName: 'table1',
              isArray: false,
              primary: false,
              name: 'column2',
              nullable: false,
              type: 'character varying',
              synchronize: true,
            },
            reason: 'missing in target',
          },
        ]);
      });
    });

    describe('ColumnDrop', () => {
      it('should find an extra column', () => {
        const diff = schemaDiff(
          newSchema({
            tables: [{ name: 'table1', columns: [{ name: 'column1' }] }],
          }),
          newSchema({
            tables: [
              {
                name: 'table1',
                columns: [{ name: 'column1' }, { name: 'column2' }],
              },
            ],
          }),
        );

        expect(diff.items).toEqual([
          {
            type: 'ColumnDrop',
            object: expect.objectContaining({ name: 'column2', tableName: 'table1' }),
            reason: 'missing in source',
          },
        ]);
      });
    });

    describe('nullable', () => {
      it('should make a column nullable', () => {
        const source = { name: 'column1', nullable: true };
        const target = { name: 'column1', nullable: false };
        const diff = schemaDiff(fromColumn(source), fromColumn(target));

        expect(diff.items).toEqual([
          {
            type: 'ColumnAlter',
            object: {
              old: expect.objectContaining(target),
              new: expect.objectContaining(source),
              changes: { nullable: true },
            },
            reason: 'nullable is different (true vs false)',
          },
        ]);
      });

      it('should make a column non-nullable', () => {
        const source = { name: 'column1', nullable: false };
        const target = { name: 'column1', nullable: true };
        const diff = schemaDiff(fromColumn(source), fromColumn(target));

        expect(diff.items).toEqual([
          {
            type: 'ColumnAlter',
            object: {
              old: expect.objectContaining(target),
              new: expect.objectContaining(source),
              changes: { nullable: false },
            },
            reason: 'nullable is different (false vs true)',
          },
        ]);
      });
    });

    describe('default', () => {
      it('should set a default value to a function', () => {
        const source = { name: 'column1', default: 'uuid_generate_v4()' };
        const target = { name: 'column1' };
        const diff = schemaDiff(fromColumn(source), fromColumn(target));

        expect(diff.items).toEqual([
          {
            type: 'ColumnAlter',
            object: {
              old: expect.objectContaining(target),
              new: expect.objectContaining(source),
              changes: {
                default: 'uuid_generate_v4()',
              },
            },
            reason: 'default is different (uuid_generate_v4() vs undefined)',
          },
        ]);
      });

      it('should ignore explicit casts for strings', () => {
        const diff = schemaDiff(
          fromColumn({ name: 'column1', type: 'character varying', default: `''` }),
          fromColumn({ name: 'column1', type: 'character varying', default: `''::character varying` }),
        );

        expect(diff.items).toEqual([]);
      });

      it('should ignore explicit casts for numbers', () => {
        const diff = schemaDiff(
          fromColumn({ name: 'column1', type: 'bigint', default: `0` }),
          fromColumn({ name: 'column1', type: 'bigint', default: `'0'::bigint` }),
        );

        expect(diff.items).toEqual([]);
      });

      it('should ignore explicit casts for enums', () => {
        const diff = schemaDiff(
          fromColumn({ name: 'column1', type: 'enum', enumName: 'enum1', default: `test` }),
          fromColumn({ name: 'column1', type: 'enum', enumName: 'enum1', default: `'test'::enum1` }),
        );

        expect(diff.items).toEqual([]);
      });

      it('should support arrays, ignoring types', () => {
        const diff = schemaDiff(
          fromColumn({ name: 'column1', type: 'character varying', isArray: true, default: "'{}'" }),
          fromColumn({
            name: 'column1',
            type: 'character varying',
            isArray: true,
            default: "'{}'::character varying[]",
          }),
        );

        expect(diff.items).toEqual([]);
      });
    });
  });

  describe('constraint', () => {
    describe('ConstraintAdd', () => {
      it('should detect a new constraint', () => {
        const source: DatabaseConstraint = {
          name: 'PK_test',
          type: ConstraintType.PRIMARY_KEY,
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        };

        const diff = schemaDiff(fromConstraint(source), fromConstraint());

        expect(diff.items).toEqual([
          {
            type: 'ConstraintAdd',
            object: source,
            reason: 'missing in target',
          },
        ]);
      });
    });

    describe('ConstraintDrop', () => {
      it('should detect an extra constraint', () => {
        const target: DatabaseConstraint = {
          name: 'PK_test',
          type: ConstraintType.PRIMARY_KEY,
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        };
        const diff = schemaDiff(fromConstraint(), fromConstraint(target));

        expect(diff.items).toEqual([
          {
            type: 'ConstraintDrop',
            object: target,
            reason: 'missing in source',
          },
        ]);
      });
    });

    describe('primary key', () => {
      it('should skip identical primary key constraints', () => {
        const constraint: DatabaseConstraint = {
          type: ConstraintType.PRIMARY_KEY,
          name: 'PK_test',
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        };

        const diff = schemaDiff(fromConstraint({ ...constraint }), fromConstraint({ ...constraint }));

        expect(diff.items).toEqual([]);
      });
    });

    describe('foreign key', () => {
      it('should skip identical foreign key constraints', () => {
        const constraint: DatabaseConstraint = {
          type: ConstraintType.FOREIGN_KEY,
          name: 'FK_test',
          tableName: 'table1',
          columnNames: ['parentId'],
          referenceTableName: 'table2',
          referenceColumnNames: ['id'],
          synchronize: true,
        };

        const diff = schemaDiff(fromConstraint(constraint), fromConstraint(constraint));

        expect(diff.items).toEqual([]);
      });

      it('should drop and recreate when the column changes', () => {
        const source: DatabaseConstraint = {
          type: ConstraintType.FOREIGN_KEY,
          name: 'FK_test',
          tableName: 'table1',
          columnNames: ['parentId'],
          referenceTableName: 'table2',
          referenceColumnNames: ['id'],
          synchronize: true,
        };
        const target = { ...source, columnNames: ['parentId2'] };

        const diff = schemaDiff(fromConstraint(source), fromConstraint(target));

        expect(diff.items).toEqual([
          {
            type: 'ConstraintDrop',
            object: target,
            reason: 'columns are different (parentId vs parentId2)',
          },
          {
            type: 'ConstraintAdd',
            object: source,
            reason: 'columns are different (parentId vs parentId2)',
          },
        ]);
      });

      it('should drop and recreate when the ON DELETE action changes', () => {
        const source: DatabaseConstraint = {
          type: ConstraintType.FOREIGN_KEY,
          name: 'FK_test',
          tableName: 'table1',
          columnNames: ['parentId'],
          referenceTableName: 'table2',
          referenceColumnNames: ['id'],
          onDelete: ActionType.CASCADE,
          synchronize: true,
        };
        const target = { ...source, onDelete: undefined };
        const diff = schemaDiff(fromConstraint(source), fromConstraint(target));

        expect(diff.items).toEqual([
          {
            type: 'ConstraintDrop',
            object: target,
            reason: 'ON DELETE action is different (CASCADE vs NO ACTION)',
          },
          {
            type: 'ConstraintAdd',
            object: source,
            reason: 'ON DELETE action is different (CASCADE vs NO ACTION)',
          },
        ]);
      });
    });

    describe('unique', () => {
      it('should skip identical unique constraints', () => {
        const constraint: DatabaseConstraint = {
          type: ConstraintType.UNIQUE,
          name: 'UQ_test',
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        };

        const diff = schemaDiff(fromConstraint({ ...constraint }), fromConstraint({ ...constraint }));

        expect(diff.items).toEqual([]);
      });
    });

    describe('check', () => {
      it('should skip identical check constraints', () => {
        const constraint: DatabaseConstraint = {
          type: ConstraintType.CHECK,
          name: 'CHK_test',
          tableName: 'table1',
          expression: 'column1 > 0',
          synchronize: true,
        };

        const diff = schemaDiff(fromConstraint({ ...constraint }), fromConstraint({ ...constraint }));

        expect(diff.items).toEqual([]);
      });
    });
  });

  describe('index', () => {
    describe('IndexCreate', () => {
      it('should detect a new index', () => {
        const diff = schemaDiff(
          fromIndex({
            name: 'IDX_test',
            tableName: 'table1',
            columnNames: ['id'],
            unique: false,
            synchronize: true,
          }),
          fromIndex(),
        );

        expect(diff.items).toEqual([
          {
            type: 'IndexCreate',
            object: {
              name: 'IDX_test',
              columnNames: ['id'],
              tableName: 'table1',
              unique: false,
              synchronize: true,
            },
            reason: 'missing in target',
          },
        ]);
      });
    });

    describe('IndexDrop', () => {
      it('should detect an extra index', () => {
        const target = {
          name: 'IDX_test',
          unique: true,
          tableName: 'table1',
          columnNames: ['id'],
          synchronize: true,
        };
        const diff = schemaDiff(fromIndex(), fromIndex(target));

        expect(diff.items).toEqual([
          {
            type: 'IndexDrop',
            object: target,
            reason: 'missing in source',
          },
        ]);
      });
    });

    it('should recreate the index if unique changes', () => {
      const source: DatabaseIndex = {
        name: 'IDX_test',
        tableName: 'table1',
        columnNames: ['id'],
        unique: true,
        synchronize: true,
      };
      const target = { ...source, unique: false };
      const diff = schemaDiff(fromIndex(source), fromIndex(target));

      expect(diff.items).toEqual([
        {
          type: 'IndexDrop',
          object: target,
          reason: 'uniqueness is different (true vs false)',
        },
        {
          type: 'IndexCreate',
          object: source,
          reason: 'uniqueness is different (true vs false)',
        },
      ]);
    });
  });
});
