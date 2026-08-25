import { SqlTransformer } from 'src/transformers/types.js';
import { DatabaseExtension } from 'src/types.js';

export const transformExtensions: SqlTransformer = (ctx, { object, type }) => {
  switch (type) {
    case 'ExtensionCreate': {
      return asExtensionCreate(object);
    }

    case 'ExtensionDrop': {
      return asExtensionDrop(object.name);
    }

    default: {
      return false;
    }
  }
};

const asExtensionCreate = (extension: DatabaseExtension): string => {
  return `CREATE EXTENSION IF NOT EXISTS "${extension.name}";`;
};

const asExtensionDrop = (extensionName: string): string => {
  return `DROP EXTENSION "${extensionName}";`;
};
