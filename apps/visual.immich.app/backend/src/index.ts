import { AutoRouter } from 'itty-router';

const router = AutoRouter({ base: '/api' });

router.get('/server/ping', () => ({ res: 'pong' }));

export default router;
