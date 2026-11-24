import { fromNumberInputValue, toNumberInputValue } from '#lib/utilities/internal.js';
import { describe, expect, it } from 'vitest';

describe('NumberInput value binding', () => {
  it.each([4.2, -1, 0, null])('hands %s back unchanged', (value) => {
    expect(toNumberInputValue(fromNumberInputValue(value))).toBe(value);
  });
});
