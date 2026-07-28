import { ConfigRepository } from './repositories/config.repository.js';
import { MediaRepository } from './repositories/media.repository.js';
import { OutlineRepository } from './repositories/outline.repository.js';
import { R2Repository } from './repositories/r2.repository.js';
import { SystemRepository } from './repositories/system.repository.js';
import { ImportService } from './services/import.service.js';

const main = async (): Promise<void> => {
  const postUrl = process.argv[2] ?? process.env.OUTLINE_POST_URL;
  if (!postUrl) {
    console.error('Usage: import-post <outline-post-url>');
    process.exit(1);
  }

  const configRepository = ConfigRepository.create();
  const config = configRepository.get();

  const systemRepository = new SystemRepository();
  const outlineRepository = new OutlineRepository(config.outlineApiKey);
  const mediaRepository = new MediaRepository();
  const r2Repository = new R2Repository(config.r2);

  const service = new ImportService(
    configRepository,
    outlineRepository,
    systemRepository,
    mediaRepository,
    r2Repository,
  );

  await service.run(postUrl);
};

// eslint-disable-next-line unicorn/prefer-await
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
