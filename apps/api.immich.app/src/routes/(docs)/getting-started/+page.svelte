<script lang="ts">
  import { ApiPage } from '$lib';
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import ApiPermission from '$lib/components/ApiPermission.svelte';
  import { Alert, Heading, Link, Text } from '@immich/ui';
  import { mdiLightbulbOnOutline } from '@mdi/js';
</script>

<ApiPageContent
  title="Getting started"
  description="Learn how to authorize your requests to the Immich API"
  nextSteps={[
    { href: ApiPage.Authentication, title: 'Learn about Authentication' },
    { href: ApiPage.Permissions, title: 'Learn about Permissions' },
  ]}
>
  <section class="flex flex-col gap-2">
    <Heading tag="h2">1. Create an API key</Heading>
    <Text
      >The easiest way to get started building with the Immich API is to <Link
        href="https://my.immich.app/user-settings?isOpen=api-keys">create an API key</Link
      >. API keys can be created in User Settings &gt; API Keys in the Immich web application. While they can be created
      with fine-grainted permissions, the easiest way to get started is to just use the <ApiPermission value="all" /> permission.
      For more details on the permissions system, see the <Link href={ApiPage.Permissions}>Permission</Link> documentation
      page.
    </Text>
  </section>

  <Alert color="warning" title="Warning">
    <Text
      >API keys are like passwords, which can give access to your account. It is important to keep them safe, and only
      share them with applications you trust.</Text
    >
  </Alert>

  <Alert color="success" title="Tip" icon={mdiLightbulbOnOutline}>
    <Text>Use the live response feature to view real data from the Immich API</Text>
  </Alert>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">2. Explore!</Heading>
    <Text
      >Explore the documentation, view <Link href={ApiPage.Endpoints}>Endpoints</Link>, <Link href={ApiPage.Models}
        >Models</Link
      > and other resources to learn more about the Immich API.
    </Text>
  </section>
</ApiPageContent>
