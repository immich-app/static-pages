import { AutoRouter, IRequest } from 'itty-router';
import { exifRouter } from './datasets/exif';

const router = AutoRouter<IRequest, [Env, ExecutionContext]>();
router.all('/exif/*', exifRouter.fetch);

export default router;
