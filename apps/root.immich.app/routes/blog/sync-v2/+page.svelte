<script>
  import mediumTests from '$lib/assets/blog/medium-tests.webp';
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import GithubReference from '$lib/components/GithubReference.svelte';
  import List from '$lib/components/List.svelte';
  import { Code, Heading, Link, Stack, Text } from '@immich/ui';
  import { dart, json } from 'svelte-highlight/languages';
</script>

<BlogPage post={Posts.NewSyncImplementation}>
  <Stack gap={4} class="text-lg">
    <Text>
      For some time now it has been painfully obvious to the team (and its users 😂), that the mobile app needs a new
      synchronization implementation. This is also one of the last roadblocks for a stable release. This post is a deep
      dive into the core issues of syncing large volumes of data with a mobile client, the technical details of the new
      implementation, as well as our thought process behind the decisions that led to the current design.
    </Text>

    <section class="flex flex-col gap-2">
      <Heading tag="h2" size="giant">Sync v1</Heading>
      <Text>
        To give a little bit of background on how the old implementation came to be, it's worth noting that the mobile
        app has changed a lot since it was originally built in 2022. Over time, a lot has changed, and, prior to recent
        discussions around <Code>v2</Code>, the team had never formally discussed a solution to the problem. Thus the
        current state, as you would expect, was problematic in a few crucial ways:
      </Text>
      <List>
        <li>
          <b>Compatibility</b> &mdash; since client applications can update independently of the server, it becomes too
          easy to introduce breaking changes, even when <i>adding</i>
          a new property.
        </li>
        <li>
          <b>Performance</b> &mdash; the <i>volume</i> of data often results in additional problems with memory usage, both
          on the server and the mobile device. Combined with the JSON message format, which requires the entire message to
          be in memory for serialization and deserialization, this leads to high memory usage during each synchronization
          attempt.
        </li>
        <li>
          <b>Efficiency</b> &mdash; a single change on the server could result in needing to re-send <i>a lot</i> of duplicate
          data to the mobile app again. Albums are especially problematic. The old implementation relies on re-sending all
          albums and their assets to the mobile app whenever the album page was "refreshed", which it did by default on navigation.
        </li>
      </List>
    </section>

    <Text>
      In short, the previous implementation has a lot of limitations which continue to plague users, especially those
      with large libraries (100,000+ assets). From the user's perspective, the app takes a long time to open, a long
      time to load the main timeline, results in a significant drop in FPS while the synchronization process is running,
      increases battery drain, and all while potentially not even being able to complete the sync at all.
    </Text>

    <section class="flex flex-col gap-2">
      <Heading tag="h2" size="giant">Sync v2</Heading>
      <Text>
        The high level goal was simple: fix all the issues with the previous implementation 😂. In all seriousness, we
        wanted the new implementation to have the following characteristics:
      </Text>
      <List>
        <li>
          <b>End-to-end streaming</b> &mdash; stream data from the server's database to the client's database in chunks
        </li>
        <li><b>Resumable</b> &mdash; easily resume a sync from where you left off</li>
        <li><b>Incremental</b> &mdash; only send data that has changed since the last sync</li>
        <li><b>Fast</b> &mdash; the queries that determine what has changed should not require full table scans</li>
        <li>
          <b>Efficient</b> &mdash; reduce memory usage by avoiding serializing or deserializing huge chunks of JSON in memory,
          especially on the main thread
        </li>
      </List>
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">End-to-end streaming</Heading>
      <Text>
        Off the bat we realized that having end-to-end streaming would be a huge win in terms of memory, stability, and
        throughput. To support end-to-end streaming to the mobile app, we would need to:
      </Text>

      <List>
        <li>Read from PostgreSQL in chunks &mdash; Server</li>
        <li>Serialize in chunks &mdash; Server</li>
        <li>Write data to the HTTP body in chunks &mdash; Server</li>
        <li>Read data from the HTTP body in chunks &mdash; Mobile</li>
        <li>Deserialize in chunks &mdash; Mobile</li>
        <li>Write to SQLite in chunks &mdash; Mobile</li>
      </List>
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h4">Database streaming</Heading>
      <Text
        >Reading from PostgreSQL in chunks was easy enough. Having just migrated to Kysely from TypeORM, we were already
        seeing massive improvements with regard to speed and memory usage in other parts of the application as we
        migrated queries to use the <Link href="https://kysely-org.github.io/kysely-apidoc/interfaces/Streamable.html">
          streaming
        </Link> interface (see <GithubReference number={16600} />, <GithubReference number={16666} />, <GithubReference
          number={16700}
        />, <GithubReference number={16706} />, etc.).</Text
      >
    </section>

    <section class="flex flex-col gap-2">
      <Text>Here is an example of what streaming looks like when querying albums:</Text>
      <CodeBlock
        code={`return this.db
  .selectFrom('album')
  .select([
    'album.id',
    'album.ownerId',
    // ...
  ])
  .where('album.ownerId', '=', userId)
  // send back a stream of results
  .stream();
}`}
      />
    </section>

    <Text>
      This enabled streaming from the database to the Node.js process, but the server still needed to send the data
      across the network in chunks. This was initially problematic as JSON is not a streamable format. We discussed a
      variety of protocols, but eventually decided to use the <Link href="https://jsonlines.org/">JSON Lines</Link> format
      for simplicity.
    </Text>

    <section class="flex flex-col gap-2">
      <Heading tag="h4">JSON Lines</Heading>
      <Text
        >JSON Lines is a convenient format for streaming JSON data over a network connection. Each line is a separate
        JSON object, making it easy to process the data incrementally.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Text>Here is what the serialization logic looks like:</Text>
      <CodeBlock
        code={`const send = (response: Writable, objects: unknown[]) => {
  for(const object of objects){
    response.write(JSON.stringify(object) + '\\n')
  }
};`}
      />
    </section>

    <Text
      >The <Code>Content-Type</Code> header just needs to be changed from <Code>application/json</Code> to <Code
        >application/jsonlines+json</Code
      >.</Text
    >

    <section class="flex flex-col gap-2">
      <Heading tag="h4">Mobile streaming</Heading>
      <Text
        >On the other side, the mobile app essentially does the opposite. It reads the data in chunks, concatenating the
        JSON objects as they arrive, making sure to only process complete lines.</Text
      >

      <CodeBlock
        code={`await for (final chunk in response.stream.transform(utf8.decoder)) {
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
}`}
        language={dart}
      />
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Resumable</Heading>
      <Text>
        Now that we had figured out how to end-to-end stream data to the mobile app, the next step was figuring out how
        to make the whole process <i>resumable</i>. If there was a network interruption, or the client disconnected part
        way through the sync, we wanted to be able to pick up where we left off, instead of having to start over from
        square one. This led us to the idea of <i>checkpoints</i> and <i>acknowledgements</i>. The basic idea was to
        keep track of the last, successfully received row, per table. The server would send an acknowledgement token
        with each row, and the mobile app would periodically send this token back, as a confirmation. If the connection
        was lost, the mobile app would initialize a new connection and the server would automatically pick up where it
        left off.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Text>There were some details that were important to get right as we were implementing this, such as:</Text>
      <List>
        <li><b>Determinism</b> &mdash; the query needed to be resumable in a predictable manner</li>
        <li>
          <b>Speed</b> &mdash; the query needed to have an index that would allow us to index into the result set right where
          we left off
        </li>
        <li>
          <b>Bulk updates</b> &mdash; the query needed to be able to handle batches of records getting updated in the same
          transaction
        </li>
      </List>
    </section>

    <Text>
      Initially we started using a simple <Code>updatedAt</Code> timestamp column, but that ended up being problematic if
      you had multiple records updated in the same millisecond. Eventually, we transitioned to <Code>UUIDv7</Code> IDs, which
      are inherently unique while also being time-based.
    </Text>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">UUIDv7</Heading>
      <Text>
        Per the <Link
          href="https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html#name-uuidv7-layout-and-bit-order"
          >specification</Link
        >, the first 48 bits of the ID are a timestamp, with millisecond precision. This means that we can use the <Code
          >UUIDv7</Code
        >
        as a reliable, unique, and fast index for our queries. We can easily query for all records with an ID greater than
        the last acknowledged ID, and be guaranteed that we will get all records that were created or updated after that
        point in time.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Text>Here is what the final query looks like, using the <Code>UUIDv7</Code> ID as the checkpoint:</Text>
      <CodeBlock
        code={`return this.db
  .selectFrom('album')
  .select([
    'album.id',
    'album.ownerId',
    // ...
  ])
  .where('album.ownerId', '=', userId)
  .where('album.updateId', '<', checkpointId) // checkpoint
  .orderBy('album.updateId', 'asc')           // deterministic
  .stream();`}
      />
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Response format</Heading>
      <Text
        >It is worth talking, briefly, about the response format. Each JSON line uses the following format, with a type,
        acknowledgement token, and a data object:</Text
      >
      <CodeBlock
        code={`{
  "type": "AlbumV1",
  "ack": "0197b214-ba2c-7c71-89d1-4bbb56a51d06",
  "data": {
    "id": "<UUID>",
    // ...
    }
  }
}`}
        language={json}
      />
    </section>

    <Text
      >The <Code>ack</Code> token can be <Code>POST</Code>-ed back to the server, after the data has been persisted to
      SQLite, client-side. The <Code>type</Code> and <Code>data</Code> fields are versioned domain-transfer-objects, which
      enable the mobile app to safely deserialize the data.
    </Text>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Checkpoints</Heading>
      <Text>
        <!--  -->
        Acknowledgements are heavily connected to the idea of checkpoints, which are essentially an acknowledgement that
        is connected to a specific table. More specifically, a specific <i>query</i>. It turns out that, because of
        sharing, there are a few situations where we actually need to track the sync progress in two or more different
        ways for the same table, such as the <Code>asset</Code> table.
      </Text>
    </section>

    <CodeBlock
      code={`export class SessionSyncCheckpointTable {
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
}`}
    />

    <Text
      >As you can see a checkpoint is tied to a specific session and <Code>SyncEntityType</Code>. The <Code
        >SyncEntityType</Code
      > represents a specific database query. Examples include:</Text
    >

    <List>
      <li><Code>AuthUserV1</Code></li>
      <li><Code>UserV1</Code></li>
      <li><Code>UserDeleteV1</Code></li>
      <li><Code>AssetV1</Code></li>
      <li><Code>AssetDeleteV1</Code></li>
      <li><Code>AssetExifV1</Code></li>
      <li><Code>AlbumV1</Code></li>
      <li><Code>AlbumDeleteV1</Code></li>
      <li>etc.</li>
    </List>

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Deletes</Heading>
      <Text>
        One thing that was a bit more annoying to manage was tracking deletes. Since the mobile app needs to know when
        to delete a record from its database, the server would need to hold on to deleted data for some period of time,
        in order to be able to send it to the client. We decided to implement this via database triggers.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h4">Triggers as Code</Heading>
      <Text>
        A trigger can run before or after a row or transaction updates or deletes a set of data. Previously, we had
        tried to stay away from using triggers, mostly because they can be hard to reason about, and are a real pain to
        track and test. However, internally, we developed <Link
          href="https://github.com/immich-app/immich/tree/main/server/src/sql-tools"
          >some tooling around schema tracking</Link
        > that we extended to include triggers and functions, and this has made it much more manageable.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Text>Here are some common building blocks that we made:</Text>
      <CodeBlock
        code={`export const updated_at = registerFunction({
  name: 'updated_at',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: \`
    DECLARE
        clock_timestamp TIMESTAMP := clock_timestamp();
    BEGIN
        new."updatedAt" = clock_timestamp;
        new."updateId" = immich_uuid_v7(clock_timestamp);
        return new;
    END;\`,
});

export const UpdatedAtTrigger = (name: string) =>
  BeforeUpdateTrigger({
    name,
    scope: 'row',
    function: updated_at,
  });`}
      />
    </section>

    <section class="flex flex-col gap-2">
      <Text>With those blocks, here is what it took to track deletes on the <Code>asset</Code> table.</Text>
      <CodeBlock
        code={`const asset_delete_audit = registerFunction({
  name: 'asset_delete_audit',
  returnType: 'TRIGGER',
  language: 'PLPGSQL',
  body: \`
    BEGIN
      INSERT INTO asset_audit ("assetId", "ownerId")
      SELECT "id", "ownerId"
      FROM OLD;
      RETURN NULL;
    END\`,
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
}`}
      />
    </section>

    <Text
      >With this tooling, which automatically generates migrations, tracks drift, and provides reusable building blocks
      for common database operations, we were able to streamline our development process regarding audit tables. Also,
      we were able to design a robust system to test these triggers and functions.</Text
    >

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Testing</Heading>
      <Text>
        From the first discussion, we knew that testing would be crucial to the success of the new implementation. We
        especially wanted to validate that the same data would not be sent multiple times, that the sync was resumable,
        and that, with all the sharing rules, the right data was being sent to the right user.
      </Text>
    </section>

    <section class="flex flex-col gap-2">
      <Heading tag="h4">Medium tests</Heading>
      <Text>
        If you have never heard of medium tests, you have probably heard of integration tests. Medium tests are
        essentially integration tests, except that they aren't restricted to specific layers of the application. They
        are bigger than unit tests, but not as big as end-to-end tests. In our case, they spin up a real database, and
        execute real queries against it, and they run <i>super</i> fast.
      </Text>
    </section>

    <Text
      >With a framework for executing real queries against a real database, we are able to describe expected sync
      situations and validate that they are working properly. Since the test uses a real database and queries, we have
      high confidence that the code is working as expected.</Text
    >

    <section class="flex flex-col gap-2">
      <Text>Here is a sample test that checks that a deleted asset is detected and sent</Text>
      <CodeBlock
        code={`it('should detect and sync a deleted asset', async () => {
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
});`}
      />
    </section>

    <section class="flex flex-col gap-2">
      <Text>Currently, we have 185 medium tests, that run in about 10 seconds.</Text>
      <img src={mediumTests} alt="185 medium tests running in 11 seconds" class="rounded-2xl" />
    </section>

    <Text
      >We have tests for various scenarios, including asset creates, updates, and deletes, assets being added and
      removed from albums, albums being created, updated, and deleted, albums being shared and unshared with users,
      users being created, updated, and deleted, exif being updated, partner sharing being enabled and disabled, and
      many, many more.</Text
    >

    <Text
      >We also have mechanisms built into the process to allow the server to communicate to the client that it needs to
      do a full sync, instead of an incremental sync. Similarly, the client can tell the server when it wants reset all
      checkpoints and start from scratch. This has been super useful for the mobile developers as they have been testing
      and troubleshooting.</Text
    >

    <section class="flex flex-col gap-2">
      <Heading tag="h3" size="large">Conclusion</Heading>
      <Text>
        In short, the team has been working hard for most of this year, in order to improve the sync process and make it
        more efficient. We believe the new process has achieved all of our goals. It is <i>resumable</i>,
        <i>incremental</i>, and <i>performant</i>. The new process takes less time and uses less memory. It has involved
        a lot of work, but we believe the results have been worth it. Moving forward, we plan to continue to expand the
        process to more tables and objects, and add tests for any issues or bugs that we discover along the way.
      </Text>
    </section>
  </Stack>
</BlogPage>
