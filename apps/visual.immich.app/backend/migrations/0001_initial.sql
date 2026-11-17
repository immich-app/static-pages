create table "user" (
  "id" text primary key,
  "oauthId" text not null unique,
  "email" text not null,
  "name" text not null,
  "role" text not null,
  "createdAt" text not null,
  "updatedAt" text not null
);

create table "session" (
  "id" text primary key,
  "token" text not null unique,
  "userId" text not null references "user" ("id") on update cascade on delete cascade,
  "createdAt" text not null,
  "updatedAt" text not null,
  "expiresAt" text not null
);

create index "session_userId_idx" on "session" ("userId");
