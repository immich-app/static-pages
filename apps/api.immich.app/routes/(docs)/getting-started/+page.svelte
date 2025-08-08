<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import ApiPermission from '$lib/api/components/ApiPermission.svelte';
  import ApiConfigureModal from '$lib/api/modals/ApiConfigureModal.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { Alert, Button, Heading, Link, modalManager, Text } from '@immich/ui';
  import { mdiLightbulbOnOutline } from '@mdi/js';

  const handleConnect = async () => {
    const results = await modalManager.show(ApiConfigureModal);
    if (results) {
      console.log(results);
    }
  };
</script>

<ApiPageContent
  title="Getting Started"
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
    <Text>Use the <Link href={ApiPage.Playground}>playground</Link> to explore the API with your API key</Text>
  </Alert>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">2. Configure the Playground</Heading>
    <Text
      >This website has a <Link href={ApiPage.Playground}>Playground</Link> feature where you can test your API key and explore
      the API endpoints for your server. To configure it, click the Configure button below.</Text
    >

    <div class="mt-4">
      <Button size="large" color="secondary" onclick={() => handleConnect()}>Configure</Button>
    </div>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">3. Explore!</Heading>
    <Text
      >Explore the documentation, and use the <Link href={ApiPage.Playground}>Playground</Link> to test your API key and
      explore the API endpoints for your server.</Text
    >
  </section>
</ApiPageContent>
