#!/usr/bin/env node
import { cpSync } from 'node:fs';
import { join, resolve } from 'node:path';

const main = () => {
  const source = resolve(join('..', '..', 'static'));
  const target = 'build/';
  console.log(`Copying ${source} to ${target}`);
  cpSync(source, target, { recursive: true });
};

main();
