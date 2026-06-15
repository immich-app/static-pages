import { SqlTransformer } from 'src/transformers/types';

export const transformEnums: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'EnumCreate': {
      return `CREATE TYPE "${object.name}" AS ENUM (${object.values.map((value) => `'${value}'`)});`;
    }

    case 'EnumDrop': {
      return `DROP TYPE "${object.name}";`;
    }

    default: {
      return false;
    }
  }
};
