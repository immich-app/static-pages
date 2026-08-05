import { computeOrder, ORDER_FILENAME, parseOrder, verifyOrderContent } from 'src/migration-order';
import { describe, expect, it } from 'vitest';

describe(ORDER_FILENAME, () => {
  describe(computeOrder.name, () => {
    it('should list migration names sorted and without extensions', () => {
      expect(computeOrder(['2000-b.ts', '1000-a.ts'])).toEqual(['1000-a', '2000-b']);
    });

    it('should ignore the ORDER file', () => {
      expect(computeOrder(['1000-a.ts', ORDER_FILENAME])).toEqual(['1000-a']);
    });

    it('should include stray files so they fail verification loudly', () => {
      expect(computeOrder(['1000-a.ts', '.DS_Store', 'README.md'])).toEqual(['.DS_Store', '1000-a', 'README']);
    });

    it('should keep colliding names so verification fails loudly', () => {
      expect(computeOrder(['1000-a.ts', '1000-a.js'])).toEqual(['1000-a', '1000-a']);
    });
  });

  describe(parseOrder.name, () => {
    it('should ignore blank lines and surrounding whitespace', () => {
      expect(parseOrder('1000-a\n\n 2000-b \n')).toEqual(['1000-a', '2000-b']);
    });
  });

  describe(verifyOrderContent.name, () => {
    it('should pass when the content matches', () => {
      expect(verifyOrderContent({ actual: ['1000-a', '2000-b'], expected: ['1000-a', '2000-b'] })).toEqual([]);
    });

    it('should fail on duplicate names', () => {
      expect(verifyOrderContent({ actual: ['1000-a', '1000-a'], expected: ['1000-a', '1000-a'] })).toEqual([
        expect.stringContaining('Duplicate migration name "1000-a"'),
        expect.stringContaining(`Duplicate ${ORDER_FILENAME} entry "1000-a"`),
      ]);
    });

    it('should fail when a migration is missing from the file', () => {
      expect(verifyOrderContent({ actual: ['1000-a'], expected: ['1000-a', '2000-b'] })).toEqual([
        expect.stringContaining(`"2000-b" is missing from ${ORDER_FILENAME}`),
      ]);
    });

    it('should fail when the file lists a migration that does not exist', () => {
      expect(verifyOrderContent({ actual: ['1000-a', '2000-b'], expected: ['1000-a'] })).toEqual([
        expect.stringContaining('does not exist'),
      ]);
    });

    it('should fail when the entries are out of order', () => {
      expect(verifyOrderContent({ actual: ['2000-b', '1000-a'], expected: ['1000-a', '2000-b'] })).toEqual([
        expect.stringContaining('out of order'),
      ]);
    });

    it('should pass when the baseline is a prefix', () => {
      const lists = { actual: ['1000-a', '2000-b'], expected: ['1000-a', '2000-b'] };
      expect(verifyOrderContent({ ...lists, appendOnlyFrom: ['1000-a'] })).toEqual([]);
      expect(verifyOrderContent({ ...lists, appendOnlyFrom: ['1000-a', '2000-b'] })).toEqual([]);
    });

    it('should fail when an entry was added before existing ones', () => {
      expect(
        verifyOrderContent({
          actual: ['1500-a', '2000-b'],
          expected: ['1500-a', '2000-b'],
          appendOnlyFrom: ['2000-b'],
        }),
      ).toEqual([expect.stringContaining('not append-only')]);
    });

    it('should fail when entries were removed', () => {
      expect(
        verifyOrderContent({ actual: ['1000-a'], expected: ['1000-a'], appendOnlyFrom: ['1000-a', '2000-b'] }),
      ).toEqual([expect.stringContaining('fewer entries')]);
    });

    it('should not report append-only violations when the content is already inconsistent', () => {
      expect(
        verifyOrderContent({ actual: ['1000-a', '2000-b'], expected: ['1000-a'], appendOnlyFrom: ['2000-b'] }),
      ).toEqual([expect.stringContaining('does not exist')]);
    });
  });
});
