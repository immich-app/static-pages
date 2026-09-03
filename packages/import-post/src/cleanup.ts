import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigRepository } from './repositories/config.repository.js';
import { R2Repository } from './repositories/r2.repository.js';
import { SystemRepository } from './repositories/system.repository.js';
import { staleKeys } from './stale-keys.js';

const { rootPath, r2 } = ConfigRepository.create().get();
const r2Repository = new R2Repository(r2);

const blog = join(rootPath, 'apps/root.immich.app/src/routes/blog');
const posts = readdirSync(blog, { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('+page.md'))
  .map((path) => readFileSync(join(blog, path), 'utf8'));

const objects = await r2Repository.listObjects('blog/');
const stale = staleKeys(posts.join('\n'), r2.publicUrl, objects);

console.log([`Bucket: ${objects.length} objects, ${stale.length} stale`, ...stale].join('\n'));
if (stale.length > 0 && (await new SystemRepository().confirm())) {
  await r2Repository.deleteKeys(stale);
  console.log(`Deleted ${stale.length} objects`);
}
