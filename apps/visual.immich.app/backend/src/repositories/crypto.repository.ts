import { Constants } from '../constants';

export class CryptoRepository {
  randomUUID(): string {
    return crypto.randomUUID();
  }

  randomToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(Constants.Session.TokenBytes));

    return btoa(String.fromCodePoint(...bytes))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '');
  }

  async hashSha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));

    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
}
