import { parseTriggerType } from 'src/readers/trigger.reader.js';
import { describe, expect, it } from 'vitest';

describe('parseTriggerType', () => {
  it('should read every action of a trigger', () => {
    // FOR EACH ROW (1) + BEFORE (2) + INSERT (4) + UPDATE (16)
    expect(parseTriggerType(23)).toEqual({ actions: ['insert', 'update'], timing: 'before', scope: 'row' });
  });
});
