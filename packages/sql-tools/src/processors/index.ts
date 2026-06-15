import { processCheckConstraints } from 'src/processors/check-constraint.processor';
import { processColumns } from 'src/processors/column.processor';
import { processConfigurationParameters } from 'src/processors/configuration-parameter.processor';
import { processDatabases } from 'src/processors/database.processor';
import { processEnums } from 'src/processors/enum.processor';
import { processExtensions } from 'src/processors/extension.processor';
import { processForeignKeyColumns } from 'src/processors/foreign-key-column.processor';
import { processForeignKeyConstraints } from 'src/processors/foreign-key-constraint.processor';
import { processFunctions } from 'src/processors/function.processor';
import { processIndexes } from 'src/processors/index.processor';
import { processOverrides } from 'src/processors/override.processor';
import { processPrimaryKeyConstraints } from 'src/processors/primary-key-contraint.processor';
import { processTableLoops } from 'src/processors/table-loops.processor';
import { processTables } from 'src/processors/table.processor';
import { processTriggers } from 'src/processors/trigger.processor';
import { processUniqueConstraints } from 'src/processors/unique-constraint.processor';
import { Processor } from 'src/types';

export const processors: Processor[] = [
  processDatabases,
  processConfigurationParameters,
  processEnums,
  processExtensions,
  processFunctions,
  processTables,
  processColumns,
  processForeignKeyColumns,
  processForeignKeyConstraints,
  processUniqueConstraints,
  processCheckConstraints,
  processPrimaryKeyConstraints,
  processIndexes,
  processTriggers,
  processOverrides,
  processTableLoops,
];
