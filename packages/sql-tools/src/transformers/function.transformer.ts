import { SqlTransformer } from 'src/transformers/types';
import { DatabaseFunction } from 'src/types';

export const transformFunctions: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'FunctionCreate': {
      return asFunctionCreate(object);
    }

    case 'FunctionDrop': {
      return asFunctionDrop(object.name);
    }

    default: {
      return false;
    }
  }
};

export const asFunctionCreate = (func: DatabaseFunction): string => {
  return func.expression;
};

const asFunctionDrop = (functionName: string): string => {
  return `DROP FUNCTION ${functionName};`;
};
