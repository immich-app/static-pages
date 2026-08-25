import { processCheckConstraints } from 'src/processors/check-constraint.processor.js';
import { processColumns } from 'src/processors/column.processor.js';
import { processConfigurationParameters } from 'src/processors/configuration-parameter.processor.js';
import { processDatabases } from 'src/processors/database.processor.js';
import { processEnums } from 'src/processors/enum.processor.js';
import { processExtensions } from 'src/processors/extension.processor.js';
import { processForeignKeyColumns } from 'src/processors/foreign-key-column.processor.js';
import { processForeignKeyConstraints } from 'src/processors/foreign-key-constraint.processor.js';
import { processFunctions } from 'src/processors/function.processor.js';
import { processIndexes } from 'src/processors/index.processor.js';
import { processOverrides } from 'src/processors/override.processor.js';
import { processPrimaryKeyConstraints } from 'src/processors/primary-key-contraint.processor.js';
import { processTableLoops } from 'src/processors/table-loops.processor.js';
import { processTables } from 'src/processors/table.processor.js';
import { processTriggers } from 'src/processors/trigger.processor.js';
import { processUniqueConstraints } from 'src/processors/unique-constraint.processor.js';
import { Processor } from 'src/types.js';

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
