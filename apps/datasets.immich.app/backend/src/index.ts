import { AutoRouter, cors, IRequest } from 'itty-router';
import { exifRouter } from './datasets/exif';
import { authRouter } from './auth';

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, [Env, ExecutionContext]>({ before: [preflight], finally: [corsify] });
router.all('/api/exif/*', exifRouter.fetch);
router.all('/api/auth/*', authRouter.fetch);

export default router;
