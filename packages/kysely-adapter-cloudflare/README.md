# Kysely Adapter Cloudflare

Kysely adapter for Cloudflare databases.

## Install

```bash
pnpm i @immich/kysely-adapter-cloudflare
```

## Example

```typescript
import { CloudflareD1Dialect } from '@immich/kysely-adapter-cloudflare';

const dialect = new CloudflareD1Dialect({ database: process.env.DB });

const db = new Kysely<MySchema>({ dialect });
```

## Transactions

The `CloudflareD1Dialect` implements Kysely transactions using the D1 [batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch) method. They're not real transactions, since D1 does not support transactions in the traditional sense. In short, queries used inside a `transaction()` are _added_ to a batch and then submitted all at once when the transaction is committed.

Note: This implies that you _cannot_ use any of the return values, as there aren't any. See examples below.

### Good

```typescript
db.transaction().execute(async (tx) => {
  await tx.insertInto('post').values(item).execute();
  await tx.insertInto('article').values(item).execute();
});
```

### Bad

```typescript
const article = // will be undefined
  await db.transaction().execute(async (tx) => {
    const post = await tx.insertInto('posts').values(item).execute();
    return tx
      .insertInto('articles')
      .values({
        ...article,
        postId: post.id, // will be undefined
      })
      .execute();
  });
```
