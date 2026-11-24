import '#lib/theme/default.css';
import { MemoryStorage } from '#test/mocks/storage.js';
import { beforeEach, vi } from 'vitest';

vi.mock('$app/env', () => ({ browser: true, dev: true, building: false, version: 'test' }));
vi.mock('$app/navigation', () => import('#test/mocks/app-navigation.js'));
vi.mock('$app/state', () => import('#test/mocks/app-state.js'));

beforeEach(() => {
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(globalThis, name, { value: new MemoryStorage(), configurable: true });
  }
});
