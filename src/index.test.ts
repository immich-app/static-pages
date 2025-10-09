import { mergeInstanceUrl, shouldRedirect } from '$lib/utils/url';
import { describe, it, expect } from 'vitest';

describe('URL utils', () => {
  describe('mergeInstanceUrl', () => {
    it('should merge hosts', () => {
      const currentUrl = new URL('https://my.immich.app/foo');

      expect(mergeInstanceUrl(currentUrl, 'https://demo.immich.app').toString()).toEqual('https://demo.immich.app/foo');
    });

    it('should merge hosts with trailing slash in instance URL', () => {
      const currentUrl = new URL('https://my.immich.app/foo');

      expect(mergeInstanceUrl(currentUrl, 'https://demo.immich.app/').toString()).toEqual(
        'https://demo.immich.app/foo',
      );
    });

    it('should merge hosts with paths', () => {
      const currentUrl = new URL('https://my.immich.app/bar');

      expect(mergeInstanceUrl(currentUrl, 'https://demo.immich.app/foo').toString()).toEqual(
        'https://demo.immich.app/foo/bar',
      );
    });

    it('should merge hosts with search params', () => {
      const currentUrl = new URL('https://my.immich.app?bar=2');

      expect(mergeInstanceUrl(currentUrl, 'https://demo.immich.app?foo=1').toString()).toEqual(
        'https://demo.immich.app/?foo=1&bar=2',
      );
    });

    it('should merge hosts with search params and paths', () => {
      const currentUrl = new URL('https://my.immich.app/baz?bar=2');

      expect(mergeInstanceUrl(currentUrl, 'https://demo.immich.app/foobar?foo=1').toString()).toEqual(
        'https://demo.immich.app/foobar/baz?foo=1&bar=2',
      );
    });
  });

  describe('shouldRedirect', () => {
    it('should not redirect if no path', () => {
      const url = new URL('https://my.immich.app');
      expect(shouldRedirect(url)).toBe(false);
    });

    it('should not redirect if at root path', () => {
      const url = new URL('https://my.immich.app/');
      expect(shouldRedirect(url)).toBe(false);
    });

    it('should not redirect if at root path with params', () => {
      const url = new URL('https://my.immich.app/?foo=1');
      expect(shouldRedirect(url)).toBe(false);
    });

    it('should redirect if not at root', () => {
      const url = new URL('https://my.immich.app/foo');
      expect(shouldRedirect(url)).toBe(true);
    });

    it('should redirect if not at root and has search param', () => {
      const url = new URL('https://my.immich.app/foo?bar=1');
      expect(shouldRedirect(url)).toBe(true);
    });
  });
});
