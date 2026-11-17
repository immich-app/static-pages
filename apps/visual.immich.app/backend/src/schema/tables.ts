import type { UserRole } from '../enum';

export type UserTable = {
  id: string;
  oauthId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type SessionTable = {
  id: string;
  token: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type DB = {
  user: UserTable;
  session: SessionTable;
};
