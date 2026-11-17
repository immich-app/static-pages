import { Constants } from '../constants';
import type { AuthDto, LoginStateDto } from '../dtos/auth.dto';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '../errors';
import type { CryptoRepository } from '../repositories/crypto.repository';
import { OAuthError, type OAuthRepository } from '../repositories/oauth.repository';
import type { SessionRepository } from '../repositories/session.repository';
import type { UserRepository } from '../repositories/user.repository';

export class AuthService {
  constructor(
    private cryptoRepository: CryptoRepository,
    private oauthRepository: OAuthRepository,
    private sessionRepository: SessionRepository,
    private userRepository: UserRepository,
  ) {}

  async startLogin({ origin, returnTo }: { origin: string; returnTo?: string }) {
    const redirectUri = `${origin}${Constants.OAuth.CallbackPath}`;
    const { url, ...oauth } = await this.oauthRepository.authorize({ redirectUri });
    const loginState: LoginStateDto = { ...oauth, returnTo: this.getReturnUrl(origin, returnTo) };

    return { url, loginState };
  }

  async finishLogin({ url, loginState }: { url: string; loginState: LoginStateDto }) {
    const { returnTo, ...oauth } = loginState;
    const profile = await this.getProfile({ url, ...oauth });
    const role = this.getRole(profile.role);
    if (!role) {
      throw new ForbiddenError();
    }

    const now = new Date();
    const user = await this.userRepository.upsert({
      id: this.cryptoRepository.randomUUID(),
      oauthId: profile.sub,
      email: profile.email,
      name: profile.name,
      role,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    const token = this.cryptoRepository.randomToken();
    await this.sessionRepository.create({
      id: this.cryptoRepository.randomUUID(),
      token: await this.cryptoRepository.hashSha256(token),
      userId: user.id,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + Constants.Session.MaxAgeSeconds * 1000).toISOString(),
    });

    return { token, returnTo };
  }

  async authenticate(token?: string): Promise<AuthDto> {
    if (!token) {
      throw new UnauthorizedError();
    }

    const session = await this.sessionRepository.getByToken(await this.cryptoRepository.hashSha256(token));
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new UnauthorizedError();
    }

    const { id, userId, email, name, role } = session;

    return { sessionId: id, user: { id: userId, email, name, role } };
  }

  private getReturnUrl(origin: string, returnTo = '/') {
    const url = URL.parse(returnTo, origin);
    if (!url || url.origin !== origin) {
      return `${origin}/`;
    }

    return url.href;
  }

  private async getProfile(options: { url: string; state: string; nonce: string; codeVerifier: string }) {
    try {
      return await this.oauthRepository.getProfile(options);
    } catch (error) {
      if (error instanceof OAuthError) {
        throw new BadRequestError('Sign in failed', { cause: error.cause });
      }

      throw error;
    }
  }

  private getRole(claim = '') {
    const claims = new Set(claim.split(','));

    return Constants.OAuth.Roles.find((item) => claims.has(item.claim))?.role;
  }
}
