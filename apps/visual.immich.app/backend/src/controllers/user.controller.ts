import { controller, route } from '../router';

export const userController = controller('/users', [
  route({
    method: 'GET',
    path: '/me',
    handler: ({ auth }) => auth.user,
  }),
]);
