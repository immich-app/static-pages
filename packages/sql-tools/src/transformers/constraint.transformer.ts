import { asColumnList } from 'src/helpers';
import { SqlTransformer } from 'src/transformers/types';
import { ActionType, ConstraintType, DatabaseConstraint } from 'src/types';

export const transformConstraints: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'ConstraintAdd': {
      return `ALTER TABLE "${object.tableName}" ADD ${asConstraintBody(object)};`;
    }

    case 'ConstraintRename': {
      return `ALTER TABLE "${object.new.tableName}" RENAME CONSTRAINT "${object.old.name}" TO "${object.new.name}";`;
    }

    case 'ConstraintDrop': {
      return `ALTER TABLE "${object.tableName}" DROP CONSTRAINT "${object.name}";`;
    }
    default: {
      return false;
    }
  }
};

const withAction = (constraint: { onDelete?: ActionType; onUpdate?: ActionType }) =>
  ` ON UPDATE ${constraint.onUpdate ?? ActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? ActionType.NO_ACTION}`;

export const asConstraintBody = (constraint: DatabaseConstraint): string => {
  const base = `CONSTRAINT "${constraint.name}"`;
  const type = constraint.type;

  switch (type) {
    case ConstraintType.PRIMARY_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} PRIMARY KEY (${columnNames})`;
    }

    case ConstraintType.FOREIGN_KEY: {
      const columnNames = asColumnList(constraint.columnNames);
      const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
      return (
        `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` +
        withAction(constraint)
      );
    }

    case ConstraintType.UNIQUE: {
      const columnNames = asColumnList(constraint.columnNames);
      return `${base} UNIQUE (${columnNames})`;
    }

    case ConstraintType.CHECK: {
      return `${base} CHECK (${constraint.expression})`;
    }

    default: {
      throw new Error(`Unknown constraint type: ${type}`);
    }
  }
};
