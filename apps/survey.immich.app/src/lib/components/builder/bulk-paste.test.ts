import { describe, it, expect } from 'vitest';

/**
 * Replicates the parsing logic from BulkPasteModal.svelte's handleSubmit().
 * The original logic is inline in the component:
 *   const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
 *   if (lines.length < 2) return;
 *   onSubmit(lines.map(l => ({ label: l, value: l })));
 */
function parseBulkPaste(text: string): { label: string; value: string }[] | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;
  return lines.map((l) => ({ label: l, value: l }));
}

describe('bulk paste parsing', () => {
  it('splits text by newlines', () => {
    const result = parseBulkPaste('Apple\nBanana');
    expect(result).toEqual([
      { label: 'Apple', value: 'Apple' },
      { label: 'Banana', value: 'Banana' },
    ]);
  });

  it('trims whitespace from each line', () => {
    const result = parseBulkPaste('  Apple  \n  Banana  ');
    expect(result).toEqual([
      { label: 'Apple', value: 'Apple' },
      { label: 'Banana', value: 'Banana' },
    ]);
  });

  it('filters out empty lines', () => {
    const result = parseBulkPaste('Apple\n\n\nBanana\n\n');
    expect(result).toEqual([
      { label: 'Apple', value: 'Apple' },
      { label: 'Banana', value: 'Banana' },
    ]);
  });

  it('filters out whitespace-only lines', () => {
    const result = parseBulkPaste('Apple\n   \n\t\nBanana');
    expect(result).toEqual([
      { label: 'Apple', value: 'Apple' },
      { label: 'Banana', value: 'Banana' },
    ]);
  });

  it('returns null when fewer than 2 options', () => {
    expect(parseBulkPaste('Only one')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseBulkPaste('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(parseBulkPaste('   \n  \n  ')).toBeNull();
  });

  it('returns null for a single non-empty line', () => {
    expect(parseBulkPaste('Just one line\n\n\n')).toBeNull();
  });

  it('produces correct {label, value} structure', () => {
    const result = parseBulkPaste('Yes\nNo\nMaybe');
    expect(result).toHaveLength(3);
    for (const option of result!) {
      expect(option).toHaveProperty('label');
      expect(option).toHaveProperty('value');
      expect(option.label).toBe(option.value);
    }
  });

  it('handles many options', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `Option ${i + 1}`);
    const result = parseBulkPaste(lines.join('\n'));
    expect(result).toHaveLength(20);
    expect(result![0]).toEqual({ label: 'Option 1', value: 'Option 1' });
    expect(result![19]).toEqual({ label: 'Option 20', value: 'Option 20' });
  });

  it('exactly 2 options meets the minimum', () => {
    const result = parseBulkPaste('A\nB');
    expect(result).toEqual([
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]);
  });
});
