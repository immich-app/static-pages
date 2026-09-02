import { isMap, isSeq, parseDocument, type Node } from 'yaml';
import type { YamlPath } from './spec';

type SourceRange = [start: number, end: number];

const rangeOf = (node: unknown): SourceRange | undefined => {
  const range = (node as Node | undefined)?.range;
  return range ? [range[0], range[1]] : undefined;
};

const pairRange = (document_: ReturnType<typeof parseDocument>, path: YamlPath): SourceRange | undefined => {
  const key = path.at(-1);
  const parent = path.length > 1 ? document_.getIn(path.slice(0, -1), true) : document_.contents;

  if (isSeq(parent) && typeof key === 'number') {
    return rangeOf(parent.items[key]);
  }

  if (isMap(parent)) {
    const pair = parent.items.find((item) => (item.key as { value?: unknown })?.value === key);
    if (!pair) {
      return undefined;
    }
    const start = rangeOf(pair.key)?.[0];
    const end = rangeOf(pair.value)?.[1];
    return start === undefined || end === undefined ? undefined : [start, end];
  }

  return undefined;
};

export const sourceRanges = (text: string, paths: YamlPath[]): SourceRange[] => {
  const document_ = parseDocument(text);
  return paths.map((path) => pairRange(document_, path)).filter((range) => range !== undefined);
};

export const highlightedLines = (text: string, paths: YamlPath[]): number[] => {
  const ranges = sourceRanges(text, paths);
  if (ranges.length === 0) {
    return [];
  }

  const lines: number[] = [];
  let start = 0;

  for (const [index, line] of text.split('\n').entries()) {
    const end = start + line.length;
    if (ranges.some(([from, to]) => from < end && to > start)) {
      lines.push(index);
    }
    start = end + 1;
  }

  return lines;
};
