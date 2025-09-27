import ApiConfigureModal from '$lib/api/modals/ApiConfigureModal.svelte';
import { modalManager } from '@immich/ui';

const LOCAL_STORAGE_KEY = 'immich-api:connection';

const login = async (apiUrl: string, dto: { email: string; password: string }) => {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    throw new Error(`Failed to login: ${response.statusText}`);
  }

  const { accessToken } = await response.json();

  return accessToken;
};

const createApiKey = async (apiUrl: string, accessToken: string) => {
  const response = await fetch(`${apiUrl}/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-session-token': accessToken,
    },
    body: JSON.stringify({ name: 'api.immich.app', permissions: ['all'] }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create API key: ${response.statusText}`);
  }

  const { secret } = await response.json();

  return secret;
};

const ping = async (apiUrl: string) => {
  const response = await fetch(`${apiUrl}/server/ping`, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    throw new Error(`Failed to ping server: ${response.statusText}`);
  }
};

type Version = { major: number; minor: number; patch: number };
const getServerVersion = async (apiUrl: string) => {
  const response = await fetch(`${apiUrl}/server/version`, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) {
    throw new Error(`Failed to get server version: ${response.statusText}`);
  }

  const version: Version = await response.json();
  return { ...version, value: `v${version.major}.${version.minor}.${version.patch}` };
};

type ApiKey = { id: string; name: string; permissions: string[] };
const getMyApiKey = async (apiUrl: string, apiKey: string): Promise<ApiKey> => {
  const response = await fetch(`${apiUrl}/server/version`, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`Failed to get my api key: ${response.statusText}`);
  }

  return response.json();
};

class PlaygroundManager {
  connected = $state(false);
  serverUrl = $state('');
  serverVersion = $state<(Version & { value: string }) | null>(null);
  apiKey = $state('');
  apiKeyResponse = $state<ApiKey | null>(null);

  constructor() {
    this.load();
    this.connect();
    this.authenticate();
  }

  async configure() {
    await modalManager.show(ApiConfigureModal);
  }

  normalize(apiUrl: string) {
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    if (!apiUrl.endsWith('/api')) {
      apiUrl = apiUrl + '/api';
    }

    return apiUrl;
  }

  reset() {
    this.apiKey = '';
    this.serverUrl = '';
    this.connected = false;
    this.serverVersion = null;
    this.apiKeyResponse = null;

    this.save();
  }

  async load() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const { apiKey = '', serverUrl = '' } = JSON.parse(data);
      this.apiKey = apiKey;
      this.serverUrl = serverUrl;
    }
  }

  async save() {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        apiKey: this.apiKey,
        serverUrl: this.serverUrl,
      }),
    );
  }

  log(message: string) {
    console.log(`[Playground] ${message}`);
  }

  async connect() {
    this.connected = false;

    if (!this.serverUrl) {
      return;
    }

    this.serverUrl = this.normalize(this.serverUrl);
    this.log(`Connecting to server: ${this.serverUrl}`);

    try {
      this.log(`  Pinging server`);
      await ping(this.serverUrl);
      this.log(`  Getting server version`);
      this.serverVersion = await getServerVersion(this.serverUrl);
      this.connected = true;
      this.log(`  Connected! (${this.serverVersion.value})`);
    } catch (error) {
      this.log(`Connection failed: ${error}`);
    }
  }

  async authenticate() {
    if (!this.connected || !this.serverVersion || !this.serverUrl || !this.apiKey) {
      return;
    }

    const { major, minor } = this.serverVersion;

    try {
      // getMyApiKey does not exist yet
      if (major === 1 && minor <= 138) {
        // return;
      }

      this.apiKeyResponse = await getMyApiKey(this.serverUrl, this.apiKey);
    } catch (error) {
      this.log(`Authentication failed: ${error}`);
    }
  }

  async connectToServer(url: string, apiKey: string) {
    this.serverUrl = url;
    this.connect();
    this.apiKey = apiKey;
    this.authenticate();
    this.save();
  }

  async connectToDemo(proxy?: boolean) {
    const demoUrl = this.normalize(proxy ? '/api' : 'https://demo.immich.app/');
    this.serverUrl = demoUrl;
    this.connect();
    const demoLogin = { email: 'demo@immich.app', password: 'demo' };
    const accessToken = await login(demoUrl, demoLogin);
    this.apiKey = await createApiKey(demoUrl, accessToken);
    this.authenticate();
    this.save();
  }

  async sendRequest({ method, url, body }: { method: string; url: string; body?: string }) {
    const response = await fetch(`${this.serverUrl}${url}`, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body && body.length > 0 && method !== 'GET' ? body : undefined,
    });

    return response;
  }
}

export const playgroundManager = new PlaygroundManager();
