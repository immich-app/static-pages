import { describe, expect, it } from 'vitest';
import { escapeSvelteCode, getIdFromText } from './utility.js';

describe('utility', () => {
  describe(getIdFromText.name, () => {
    it('should generate a valid ID from text', () => {
      const result = getIdFromText('Hello World!');
      expect(result).toBe('hello-world');
    });

    it('should keep digits, including zero', () => {
      expect(getIdFromText('v3.0.0')).toBe('v300');
    });

    it('should ignore tags but keep their text', () => {
      expect(getIdFromText('Using <code>restic</code>')).toBe('using-restic');
    });

    it('should treat non-breaking spaces as word separators', () => {
      expect(getIdFromText('Docker tag for v2\u{A0}versions')).toBe('docker-tag-for-v2-versions');
    });

    it('should keep underscores like github does', () => {
      expect(getIdFromText('Removed MACHINE_LEARNING_PRELOAD__CLIP')).toBe('removed-machine_learning_preload__clip');
    });
  });

  describe(escapeSvelteCode.name, () => {
    it('should escape curly braces', () => {
      const code = "const test = { foo: 'bar' };";
      const expected = String.raw`const test = \{ foo: 'bar' \};`;

      expect(escapeSvelteCode(code)).toBe(expected);
    });

    it('should escape backtics', () => {
      const code = 'console.log(`Hello World!`);';
      const expected = 'console.log(\\`Hello World!\\`);';

      expect(escapeSvelteCode(code)).toBe(expected);
    });
  });
});
