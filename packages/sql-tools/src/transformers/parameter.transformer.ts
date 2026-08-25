import { SqlTransformer } from 'src/transformers/types.js';
import { DatabaseParameter } from 'src/types.js';

export const transformParameters: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'ParameterSet': {
      return asParameterSet(object);
    }

    case 'ParameterReset': {
      return asParameterReset(object.databaseName, object.name);
    }

    default: {
      return false;
    }
  }
};

const asParameterSet = (parameter: DatabaseParameter): string => {
  let sql = '';
  if (parameter.scope === 'database') {
    sql += `ALTER DATABASE "${parameter.databaseName}" `;
  }

  sql += `SET ${parameter.name} TO ${parameter.value}`;

  return sql;
};

const asParameterReset = (databaseName: string, parameterName: string): string => {
  return `ALTER DATABASE "${databaseName}" RESET "${parameterName}"`;
};
