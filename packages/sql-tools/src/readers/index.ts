import { readColumns } from 'src/readers/column.reader.js';
import { readComments } from 'src/readers/comment.reader.js';
import { readConstraints } from 'src/readers/constraint.reader.js';
import { readExtensions } from 'src/readers/extension.reader.js';
import { readFunctions } from 'src/readers/function.reader.js';
import { readIndexes } from 'src/readers/index.reader.js';
import { readName } from 'src/readers/name.reader.js';
import { readOverrides } from 'src/readers/override.reader.js';
import { readParameters } from 'src/readers/parameter.reader.js';
import { readTables } from 'src/readers/table.reader.js';
import { readTriggers } from 'src/readers/trigger.reader.js';
import { Reader } from 'src/types.js';

export const readers: Reader[] = [
  readName,
  readParameters,
  readExtensions,
  readFunctions,
  readTables,
  readColumns,
  readIndexes,
  readConstraints,
  readTriggers,
  readComments,
  readOverrides,
];
