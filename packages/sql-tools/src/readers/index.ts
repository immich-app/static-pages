import { readColumns } from 'src/readers/column.reader';
import { readComments } from 'src/readers/comment.reader';
import { readConstraints } from 'src/readers/constraint.reader';
import { readExtensions } from 'src/readers/extension.reader';
import { readFunctions } from 'src/readers/function.reader';
import { readIndexes } from 'src/readers/index.reader';
import { readName } from 'src/readers/name.reader';
import { readOverrides } from 'src/readers/override.reader';
import { readParameters } from 'src/readers/parameter.reader';
import { readTables } from 'src/readers/table.reader';
import { readTriggers } from 'src/readers/trigger.reader';
import { Reader } from 'src/types';

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
