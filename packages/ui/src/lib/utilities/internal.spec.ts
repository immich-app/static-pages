import { fromNumberInputValue, toNumberInputValue } from '#lib/utilities/internal.js';
import { describe, expect, it } from 'vitest';

describe('NumberInput value binding', () => {
  // Svelte rewrites the `<input type="number">` (losing the caret and any partial text such as "4." or "-")
  // whenever the getter does not return exactly what the binding handed to the setter.
  it.each([4.2, -1, 0, null])('hands %s back unchanged', (value) => {
    expect(toNumberInputValue(fromNumberInputValue(value))).toBe(value);
  });
});
