import { authController } from './controllers/auth.controller';
import { serverController } from './controllers/server.controller';
import { userController } from './controllers/user.controller';
import { router } from './router';

export const app = router('/api', [authController, serverController, userController]);
