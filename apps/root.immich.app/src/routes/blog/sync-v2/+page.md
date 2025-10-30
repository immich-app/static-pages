---
id: 0199bf43-a42d-75e8-9cab-06041f89ed14
title: Sync v2
description: Learn how Immich developed a better way to synchronize data with the mobile app.
publishedAt: 2025-09-24
authors: [Jason Rasmussen]
---

<script>
  import mediumTests from '$lib/assets/img/medium-tests.webp';
  import GithubReference from '$lib/components/GithubReference.svelte';
</script>

For some time now it has been painfully obvious to the team (and its users 😂), that the mobile app needs a new synchronization implementation. This is also one of the last roadblocks for a stable release. This post is a deep dive into the core issues of syncing large volumes of data with a mobile client, the technical details of the new implementation, as well as our thought process behind the decisions that led to the current design.

## Sync v1

To give a little bit of background on how the old implementation came to be, it's worth noting that the mobile app has changed a lot since it was originally built in 2022. Over time, a lot has changed, and, prior to recent discussions around `v2`, the team had never formally discussed a solution to the problem. Thus the current state, as you would expect, was problematic in a few crucial ways:

- **Compatibility** &mdash; since client applications can update independently of the server, it becomes too easy to introduce breaking changes, even when _adding_ a new property.
- **Performance** &mdash; the _volume_ of data often results in additional problems with memory usage, both on the server and the mobile device. Combined with the JSON message format, which requires the entire message to be in memory for serialization and deserialization, this leads to high memory usage during each synchronization attempt.
- **Efficiency** &mdash; a single change on the server could result in needing to re-send _a lot_ of duplicate data to the mobile app again. Albums are especially problematic. The old implementation relies on re-sending all albums and their assets to the mobile app whenever the album page was "refreshed", which it did by default on navigation.

In short, the previous implementation has a lot of limitations which continue to plague users, especially those with
large libraries (100,000+ assets). From the user's perspective, the app takes a long time to open, a long time to
load the main timeline, results in a significant drop in FPS while the synchronization process is running, increases
battery drain, and all while potentially not even being able to complete the sync at all.

## Sync v2

The high level goal was simple: fix all the issues with the previous implementation 😂. In all seriousness, we wanted the new implementation to have the following characteristics:

- **End-to-end streaming** &mdash; stream data from the server's database to the client's database in chunks
- **Resumable** &mdash; easily resume a sync from where you left off
- **Incremental** &mdash; only send data that has changed since the last sync
- **Fast** &mdash; the queries that determine what has changed should not require full table scans
- **Efficient** &mdash; reduce memory usage by avoiding serializing or deserializing huge chunks of JSON in memory, especially on the main thread

### End-to-end streaming

Off the bat we realized that having end-to-end streaming would be a huge win in terms of memory, stability, and throughput. To support end-to-end streaming to the mobile app, we would need to:

- Read from PostgreSQL in chunks &mdash; Server
- Serialize in chunks &mdash; Server
- Write data to the HTTP body in chunks &mdash; Server
- Read data from the HTTP body in chunks &mdash; Mobile
- Deserialize in chunks &mdash; Mobile
- Write to SQLite in chunks &mdash; Mobile

#### Database streaming

Reading from PostgreSQL in chunks was easy enough. Having just migrated to Kysely from TypeORM, we were already seeing massive improvements with regard to speed and memory usage in other parts of the application as we migrated queries to use the [streaming](https://kysely-org.github.io/kysely-apidoc/interfaces/Streamable.html) interface (see <GithubReference number={16600} />, <GithubReference number={16666} />, <GithubReference number={16700} />, <GithubReference number={16706} />, etc.).

Here is an example of what streaming looks like when querying albums:

```typescript
return this.db
  .selectFrom('album')
  .select([
    'album.id',
    'album.ownerId',
    // ...
  ])
  .where('album.ownerId', '=', userId)
  // send back a stream of results
  .stream();
}
```

This enabled streaming from the database to the Node.js process, but the server still needed to send the data across the network in chunks. This was initially problematic as JSON is not a streamable format. We discussed a variety of protocols, but eventually decided to use the [JSON Lines](https://jsonlines.org/) format for simplicity.

#### JSON Lines

JSON Lines is a convenient format for streaming JSON data over a network connection. Each line is a separate JSON object, making it easy to process the data incrementally.
Here is what the serialization logic looks like:

```typescript
const send = (response: Writable, objects: unknown[]) => {
  for (const object of objects) {
    response.write(JSON.stringify(object) + '\\n');
  }
};
```

The `Content-Type` header just needs to be changed from `application/json` to `application/jsonlines+json`.

#### Mobile streaming

On the other side, the mobile app essentially does the opposite. It reads the data in chunks, concatenating the JSON objects as they arrive, making sure to only process complete lines.

```dart
await for (final chunk in response.stream.transform(utf8.decoder)) {
  if (shouldAbort) {
    break;
  }

  previousChunk += chunk;
  final parts = previousChunk.toString().split('\\n');
  previousChunk = parts.removeLast();
  lines.addAll(parts);

  if (lines.length < batchSize) {
    continue;
  }

  await onData(_parseLines(lines), abort, reset);
  lines.clear();
}
```

### Resumable

Now that we had figured out how to end-to-end stream data to the mobile app, the next step was figuring out how to make the whole process _resumable_. If there was a network interruption, or the client disconnected part way through the sync, we wanted to be able to pick up where we left off, instead of having to start over from square one. This led us to the idea of _checkpoints_ and _acknowledgements_. The basic idea was to keep track of the last, successfully received row, per table. The server would send an acknowledgement token with each row, and the mobile app would periodically send this token back, as a confirmation. If the connection was lost, the mobile app would initialize a new connection and the server would automatically pick up where it left off.

There were some details that were important to get right as we were implementing this, such as:

- **Determinism** &mdash; the query needed to be resumable in a predictable manner
- **Speed** &mdash; the query needed to have an index that would allow us to index into the result set right where we left off
- **Bulk updates** &mdash; the query needed to be able to handle batches of records getting updated in the same transaction

Initially we started using a simple `updatedAt` timestamp column, but that ended up being problematic if you had multiple records updated in the same millisecond. Eventually, we transitioned to `UUIDv7` IDs, which are inherently unique while also being time-based.

### UUIDv7

Per the [specification](https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html#name-uuidv7-layout-and-bit-order), the first 48 bits of the ID are a timestamp, with millisecond precision. This means that we can use the `UUIDv7` as a reliable, unique, and fast index for our queries. We can easily query for all records with an ID greater than the last acknowledged ID, and be guaranteed that we will get all records that were created or updated after that point in time.

Here is what the final query looks like, using the `UUIDv7` ID as the checkpoint:

```typescript
return this.db
  .selectFrom('album')
  .select([
    'album.id',
    'album.ownerId',
    // ...
  ])
  .where('album.ownerId', '=', userId)
  .where('album.updateId', '<', checkpointId) // checkpoint
  .orderBy('album.updateId', 'asc') // deterministic
  .stream();
```

### Response format

It is worth talking, briefly, about the response format. Each JSON line uses the following format, with a type, acknowledgement token, and a data object:

```json
{
  "type": "AlbumV1",
  "ack": "0197b214-ba2c-7c71-89d1-4bbb56a51d06",
  "data": {
    "id": "<UUID>",
    // ...
    }
  }
}
```

The `ack` token can be `POST`-ed back to the server, after the data has been persisted to
SQLite, client-side. The `type` and `data` fields are versioned domain-transfer-objects, which
enable the mobile app to safely deserialize the data.

### Checkpoints

Acknowledgements are heavily connected to the idea of checkpoints, which are essentially an acknowledgement that is connected to a specific table. More specifically, a specific _query_. It turns out that, because of sharing, there are a few situations where we actually need to track the sync progress in two or more different ways for the same table, such as the `asset` table.

```typescript
export class SessionSyncCheckpointTable {
  @ForeignKeyColumn(() => SessionTable, { onDelete: 'CASCADE', onUpdate: 'CASCADE', primary: true })
  sessionId!: string;

  @PrimaryColumn({ type: 'character varying' })
  type!: SyncEntityType;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @Column()
  ack!: string;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
```

As you can see a checkpoint is tied to a specific session and `SyncEntityType`. The `SyncEntityType` represents a specific database query. Examples include:

- `AuthUserV1`
- `UserV1`
- `UserDeleteV1`
- `AssetV1`
- `AssetDeleteV1`
- `AssetExifV1`
- `AlbumV1`
- `AlbumDeleteV1`
- etc.

### Deletes

One thing that was a bit more annoying to manage was tracking deletes. Since the mobile app needs to know when to delete a record from its database, the server would need to hold on to deleted data for some period of time, in order to be able to send it to the client. We decided to implement this via database triggers.

#### Triggers as Code

A trigger can run before or after a row or transaction updates or deletes a set of data. Previously, we had tried to stay away from using triggers, mostly because they can be hard to reason about, and are a real pain to track and test. However, internally, we developed [some tooling around schema tracking](https://github.com/immich-app/immich/tree/main/server/src/sql-tools) that we extended to include triggers and functions, and this has made it much more manageable.

Here are some common building blocks that we made:

```typescript
export const updated_at = registerFunction({
  name: 'updated_at',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    DECLARE
        clock_timestamp TIMESTAMP := clock_timestamp();
    BEGIN
        new."updatedAt" = clock_timestamp;
        new."updateId" = immich_uuid_v7(clock_timestamp);
        return new;
    END;`,
});

export const UpdatedAtTrigger = (name: string) =>
  BeforeUpdateTrigger({
    name,
    scope: 'row',
    function: updated_at,
  });
```

With those blocks, here is what it took to track deletes on the `asset` table.

```typescript
const asset_delete_audit = registerFunction({
  name: 'asset_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: `
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END`,
});

@Table('asset')
@UpdatedAtTrigger('asset_updatedAt')
@AfterDeleteTrigger({
  scope: 'statement',
  function: asset_delete_audit,
  referencingOldTableAs: 'old',
  when: 'pg_trigger_depth() = 0',
})
class AssetTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  // ...
}
```

With this tooling, which automatically generates migrations, tracks drift, and provides reusable building blocks for common database operations, we were able to streamline our development process regarding audit tables. Also, we were able to design a robust system to test these triggers and functions.

### Testing

From the first discussion, we knew that testing would be crucial to the success of the new implementation. We especially wanted to validate that the same data would not be sent multiple times, that the sync was resumable, and that, with all the sharing rules, the right data was being sent to the right user.

#### Medium tests

If you have never heard of medium tests, you have probably heard of integration tests. Medium tests are essentially integration tests, except that they aren't restricted to specific layers of the application. They are bigger than unit tests, but not as big as end-to-end tests. In our case, they spin up a real database, and execute real queries against it, and they run _super_ fast.

With a framework for executing real queries against a real database, we are able to describe expected sync situations and validate that they are working properly. Since the test uses a real database and queries, we have high confidence that the code is working as expected.

Here is a sample test that checks that a deleted asset is detected and sent

```typescript
it('should detect and sync a deleted asset', async () => {
  const { auth, ctx } = await setup();
  const assetRepo = ctx.get(AssetRepository);
  const { asset } = await ctx.newAsset({ ownerId: auth.user.id });
  await assetRepo.remove(asset);

  const response = await ctx.syncStream(auth, [SyncRequestType.AssetsV1]);
  expect(response).toEqual([
    {
      ack: expect.any(String),
      data: {
        assetId: asset.id,
      },
      type: 'AssetDeleteV1',
    },
    expect.objectContaining({ type: SyncEntityType.SyncCompleteV1 }),
  ]);

  await ctx.syncAckAll(auth, response);
  await ctx.assertSyncIsComplete(auth, [SyncRequestType.AssetsV1]);
});
```

Currently, we have 185 medium tests, that run in about 10 seconds.

<img src={mediumTests} alt="185 medium tests running in 11 seconds" class="rounded-2xl" />

We have tests for various scenarios, including asset creates, updates, and deletes, assets being added and removed from albums, albums being created, updated, and deleted, albums being shared and unshared with users, users being created, updated, and deleted, exif being updated, partner sharing being enabled and disabled, and many, many more.

We also have mechanisms built into the process to allow the server to communicate to the client that it needs to do a full sync, instead of an incremental sync. Similarly, the client can tell the server when it wants reset all checkpoints and start from scratch. This has been super useful for the mobile developers as they have been testing and troubleshooting.

### Conclusion

In short, the team has been working hard for most of this year, in order to improve the sync process and make it more efficient. We believe the new process has achieved all of our goals. It is _resumable_, _incremental_, and _performant_. The new process takes less time and uses less memory. It has involved a lot of work, but we believe the results have been worth it. Moving forward, we plan to continue to expand the process to more tables and objects, and add tests for any issues or bugs that we discover along the way.
