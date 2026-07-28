import { transformColumns } from 'src/transformers/column.transformer';
import { transformConstraints } from 'src/transformers/constraint.transformer';
import { transformEnums } from 'src/transformers/enum.transformer';
import { transformExtensions } from 'src/transformers/extension.transformer';
import { transformFunctions } from 'src/transformers/function.transformer';
import { transformIndexes } from 'src/transformers/index.transformer';
import { transformOverrides } from 'src/transformers/override.transformer';
import { transformParameters } from 'src/transformers/parameter.transformer';
import { transformTables } from 'src/transformers/table.transformer';
import { transformTriggers } from 'src/transformers/trigger.transformer';
import { SqlTransformer } from 'src/transformers/types';

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
