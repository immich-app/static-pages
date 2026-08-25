import { transformColumns } from 'src/transformers/column.transformer.js';
import { transformConstraints } from 'src/transformers/constraint.transformer.js';
import { transformEnums } from 'src/transformers/enum.transformer.js';
import { transformExtensions } from 'src/transformers/extension.transformer.js';
import { transformFunctions } from 'src/transformers/function.transformer.js';
import { transformIndexes } from 'src/transformers/index.transformer.js';
import { transformOverrides } from 'src/transformers/override.transformer.js';
import { transformParameters } from 'src/transformers/parameter.transformer.js';
import { transformTables } from 'src/transformers/table.transformer.js';
import { transformTriggers } from 'src/transformers/trigger.transformer.js';
import { SqlTransformer } from 'src/transformers/types.js';

export const transformers: SqlTransformer[] = [
  transformColumns,
  transformConstraints,
  transformEnums,
  transformExtensions,
  transformFunctions,
  transformIndexes,
  transformParameters,
  transformTables,
  transformTriggers,
  transformOverrides,
];
