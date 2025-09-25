<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import ApiPermission from '$lib/api/components/ApiPermission.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { Alert, Card, CardBody, CardHeader, Code, CodeBlock, Heading, Link, Text } from '@immich/ui';
  import { mdiLightbulbOnOutline } from '@mdi/js';
  import { plaintext } from 'svelte-highlight/languages';
</script>

<ApiPageContent
  title="Authentication"
  description="Learn how to authorize your requests to the Immich API"
  nextSteps={[
    { href: ApiPage.Permissions, title: 'Learn about permissions' },
    { href: ApiPage.Endpoints, title: 'View API endpoints' },
  ]}
>
  <section class="flex flex-col gap-2">
    <Heading tag="h2">Overview</Heading>
    <Text>
      While some endpoints do not require authentication, the majority do. In order to authenticate a request, the
      Immich API supports a few different schemes: session, shared key, and API key. 3rd party applications are
      encouraged to use API keys, which support fine-grained permissions. Lastly, shared links and their associated keys
      or slugs can be used to access a subset of API endpoints, and are scoped to a specific album or set of assets.
    </Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">Authentication</Heading>
    <Text
      >Users or applications can authenticate with the Immich API using one of the values listed below. API keys can
      optionally be created with scoped permissions, while session tokens are tied to a specific user session, and have
      an implied <ApiPermission value="all" /> permission.
    </Text>

    <Card class="mt-2">
      <CardHeader class="py-1 bg-subtle">
        <div class="grid grid-cols-3">
          <div class="font-bold">Type</div>
          <div class="font-bold">Value</div>
          <div class="font-bold">Description</div>
        </div>
      </CardHeader>
      <CardBody>
        <div class="grid grid-cols-3 gap-y-1">
          <div>Request Header</div>
          <div><Code>x-api-key</Code></div>
          <div>API key sent as a http header</div>

          <div>Query Param</div>
          <div><Code>apiKey</Code></div>
          <div>API key sent as a query parameter</div>

          <hr class="col-span-3 my-2" />

          <div>Request Header</div>
          <div><Code>x-immich-user-token</Code></div>
          <div>Session token sent as a http header</div>

          <div>Request Header</div>
          <div><Code>x-immich-session-token</Code></div>
          <div>Session token sent as a http header</div>

          <div>Query Param</div>
          <div><Code>sessionKey</Code></div>
          <div>Session token sent as a query parameter</div>

          <hr class="col-span-3 my-2" />

          <div>Request Header</div>
          <div><Code>x-immich-share-key</Code></div>
          <div>Shared link key sent as a http header</div>

          <div>Query Param</div>
          <div><Code>key</Code></div>
          <div>Shared link key sent as a query parameter</div>

          <hr class="col-span-3 my-2" />

          <div>Request Header</div>
          <div><Code>x-immich-share-slug</Code></div>
          <div>Shared link slug sent as a http header</div>

          <div>Query Param</div>
          <div><Code>slug</Code></div>
          <div>Shared link slug sent as a query parameter</div>
        </div>
      </CardBody>
    </Card>
  </section>

  <Alert color="success" icon={mdiLightbulbOnOutline} class="mt-4">
    <Text
      >User-scoped api keys can be created in <Link href="https://my.immich.app/user-settings?isOpen=api-keys"
        >user settings</Link
      >
    </Text>
  </Alert>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">API Keys</Heading>

    <Text>
      In order to authenticate a request with an API key, you need to include the <Code>x-immich-api-key</Code> header in
      your request.
    </Text>
    <CodeBlock code="x-immich-api-key: <apiKey>" language={plaintext} />

    <Text class="pt-4">
      Alternatively, you can also include the API key by using the <Code>apiKey</Code> query parameter in your request.
    </Text>
    <CodeBlock code="https://demo.immich.app/api/assets?apiKey=<apiKey>" language={plaintext} />
  </section>
</ApiPageContent>
