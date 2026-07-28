import { asJsonString } from 'src/helpers';
import { SqlTransformer } from 'src/transformers/types';

export const transformOverrides: SqlTransformer = (ctx, { object, type }) => {
  const tableName = ctx.overrideTableName;

  const toJson = (value: unknown) => asJsonString(value, { outputTarget: ctx.outputTarget });

  switch (type) {
    case 'OverrideCreate': {
      return `INSERT INTO "${tableName}" ("name", "value") VALUES ('${object.name}', ${toJson(object.value)});`;
    }

    case 'OverrideUpdate': {
      return `UPDATE "${tableName}" SET "value" = ${toJson(object.value)} WHERE "name" = '${object.name}';`;
    }

    case 'OverrideDrop': {
      return `DELETE FROM "${tableName}" WHERE "name" = '${object.name}';`;
    }

    default: {
      return false;
    }
  }
};
