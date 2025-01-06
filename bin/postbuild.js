#!/usr/bin/env node

import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const app = process.env.IMMICH_APP;

const main = () => {
  if (!app) {
    console.log('No IMMICH_APP environment variable set, skipping');
    return;
  }

  const staticDir = join('apps', app, 'static');
  if (!existsSync(staticDir)) {
    console.log(`${staticDir} does not exist, skipping`);
    return;
  }

  console.log(`Copying ${staticDir} to build/`);
  cpSync(staticDir, 'build/', { recursive: true });
};

main();
