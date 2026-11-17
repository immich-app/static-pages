import { controller, route } from '../router';

export const serverController = controller('/server', [
  route({
    method: 'GET',
    path: '/ping',
    auth: { public: true },
    handler: () => ({ res: 'pong' }),
  }),
]);
