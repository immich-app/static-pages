<script lang="ts">
  import DocsHeader from '$lib/components/DocsHeader.svelte';
  import PageContent from '$lib/components/PageContent.svelte';
  import {
    Alert,
    AppShell,
    AppShellHeader,
    AppShellSidebar,
    Card,
    CardBody,
    CardHeader,
    Code,
    Heading,
    Link,
    NavbarGroup,
    NavbarItem,
    Text,
  } from '@immich/ui';
  import { mdiCodeJson, mdiHomeOutline, mdiLightbulbOnOutline, mdiPencilRuler } from '@mdi/js';
</script>

<AppShell>
  <AppShellHeader>
    <DocsHeader />
  </AppShellHeader>

  <AppShellSidebar class="min-w-[250px]">
    <div class="mt-4 mr-0 lg:mr-4">
      <NavbarGroup title="API Documentation" />
    </div>
    <div class="mt-4 mr-0 md:mr-4">
      <NavbarItem title="Overview" href="/api" icon={mdiHomeOutline} />
      <NavbarItem title="Endpoints" href="/api/endpoints" icon={mdiCodeJson} />
      <NavbarItem title="Models" href="/api/models" icon={mdiPencilRuler} />
    </div>
  </AppShellSidebar>

  <PageContent class="max-w-screen-lg">
    <Heading size="large" tag="h1">Welcome</Heading>
    <Text>This is documentation for the API that powers <Link href="https://immich.app">Immich</Link></Text>

    <section class="mt-4">
      <Heading size="small" tag="h2">Authentication</Heading>
      <Text>Users or applications can authenticate with the Immich Api using one of the values listed below.</Text>

      <Card class="mt-2">
        <CardHeader class="py-1 bg-subtle">
          <div class="grid grid-cols-3">
            <div class="font-bold">Value</div>
            <div class="font-bold">Type</div>
            <div class="font-bold">Description</div>
          </div>
        </CardHeader>
        <CardBody>
          <div class="grid grid-cols-3 gap-y-1">
            <div><Code>x-api-key</Code></div>
            <div>Header</div>
            <div>Api key value sent as a http header</div>

            <div><Code>x-immich-user-token</Code></div>
            <div>Header</div>
            <div>Session token sent as a http header</div>

            <div><Code>x-immich-session-token</Code></div>
            <div>Header</div>
            <div>Session token sent as a http header</div>

            <div><Code>apiKey</Code></div>
            <div>Query Param</div>
            <div>Api key value sent as a query parameter</div>

            <div><Code>sessionKey</Code></div>
            <div>Query Param</div>
            <div>Session token sent as a query parameter</div>

            <div><Code>key</Code></div>
            <div>Query Param</div>
            <div>Shared link key sent as a query parameter</div>
          </div>
        </CardBody>
      </Card>

      <Alert color="success" title="Tip" icon={mdiLightbulbOnOutline} class="mt-4">
        <Text
          >User-scoped api keys can be created in <Link href="https://my.immich.app/user-settings?isOpen=api-keys"
            >user settings</Link
          >
        </Text>
      </Alert>
    </section>

    <section class="mt-4">
      <Heading size="small" tag="h2">Open API</Heading>
      <Text
        >Immich uses the <Code>nest-swagger</Code> library to automatically generate an Open API compatible JSON document.
        This document is the basis for this documentation, as well as the <Code>@immich/sdk</Code> TypeScript client, which
        is published on <Link href="https://www.npmjs.com/package/@immich/sdk">npm</Link></Text
      >
    </section>

    <section class="mt-4">
      <Heading size="small" tag="h2">SDK</Heading>
      <Text
        >For more information about the <Code>@immich/sdk</Code> package, see the <Link
          href="https://www.npmjs.com/package/@immich/sdk">project on npm</Link
        ></Text
      >
    </section>

    <section class="mt-4">
      <Heading size="small" tag="h2">SDK</Heading>
      <Text>Immich</Text>
    </section>
  </PageContent>
</AppShell>
