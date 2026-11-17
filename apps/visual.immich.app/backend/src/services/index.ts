import { createDatabase } from '../database';
import { CryptoRepository } from '../repositories/crypto.repository';
import { OAuthRepository } from '../repositories/oauth.repository';
import { SessionRepository } from '../repositories/session.repository';
import { UserRepository } from '../repositories/user.repository';
import { AuthService } from './auth.service';

export const createServices = (env: Env) => {
  const db = createDatabase(env.DB);
  const oauthRepository = new OAuthRepository({
    issuer: env.OAUTH_ISSUER,
    clientId: env.OAUTH_CLIENT_ID,
    clientSecret: env.OAUTH_CLIENT_SECRET,
  });

  return {
    auth: new AuthService(new CryptoRepository(), oauthRepository, new SessionRepository(db), new UserRepository(db)),
  };
};

export type Services = ReturnType<typeof createServices>;
