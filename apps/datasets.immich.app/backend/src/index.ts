import { AutoRouter, cors, IRequest } from 'itty-router';
import { authRouter } from './auth';
import { exifRouter } from './datasets/exif';
import { petsRouter } from './datasets/pets';

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, [Env, ExecutionContext]>({ before: [preflight], finally: [corsify] });
router.all('/api/exif/*', exifRouter.fetch);
router.all('/api/pets/*', petsRouter.fetch);
router.all('/api/auth/*', authRouter.fetch);

export default router;
