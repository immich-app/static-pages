import { markedText } from './markdown.js';
import { describe, expect, it } from 'vitest';

describe(markedText.name, () => {
  it('should return an empty string for empty input', () => {
    expect(markedText('')).toEqual('');
  });

  it('should strip front matter', () => {
    expect(markedText('---\ntitle: Hello\nauthors: [Jane]\n---\n# Body here')).toEqual('Body here');
  });

  it('should include heading text', () => {
    expect(markedText('# Title\n\nSome text.')).toEqual('Title Some text.');
  });

  it('should join multiple paragraphs with a space', () => {
    expect(markedText('First paragraph.\n\nSecond paragraph.')).toEqual('First paragraph. Second paragraph.');
  });

  it('should collapse whitespace and trim', () => {
    expect(markedText('One.\n\n\nTwo.   Three.')).toEqual('One. Two. Three.');
  });

  it('should render links as their visible text', () => {
    expect(markedText('[test](https://immich.app) is cool')).toEqual('test is cool');
  });

  it('should render bold and italic as plain text', () => {
    expect(markedText('Hello **bold** and _em_')).toEqual('Hello bold and em');
  });

  it('should render inline code as plain text', () => {
    expect(markedText('Run `npm install` now')).toEqual('Run npm install now');
  });

  it('should render an image as its alt text', () => {
    expect(markedText('![alt text](/img.png)')).toEqual('alt text');
  });

  it('should convert emoji shortcodes', () => {
    expect(markedText('Backup complete :tada:')).toEqual('Backup complete 🎉');
  });

  describe('admonitions', () => {
    it('should keep the body and drop the ::: markers', () => {
      expect(markedText(':::info\nThis is **important** info.\n:::')).toEqual('This is important info.');
    });

    it('should render an admonition with a title', () => {
      expect(markedText(':::tip Pro tip\nDo the thing.\n:::')).toEqual('Do the thing.');
    });
  });

  describe('html / jsx', () => {
    it('should keep the inner text of a block-level component', () => {
      expect(markedText('<Button href="/x">Download now</Button>')).toEqual('Download now');
    });

    it('should keep the inner text of an inline component', () => {
      expect(markedText('Click <Button>here</Button> today')).toEqual('Click here today');
    });

    it('should remove script blocks entirely, including their contents', () => {
      expect(markedText('Before\n\n<script>\nconst x = 1;\n</script>\n\nAfter')).toEqual('Before After');
    });
  });
});
