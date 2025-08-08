<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { Alert, Link, Text } from '@immich/ui';
  import { mdiLightbulbOnOutline } from '@mdi/js';
</script>

<ApiPageContent
  title="Getting Started"
  description="Learn how to authorize your requests to the Immich API"
  nextSteps={[
    { href: '/authentication', title: 'Learn about Authentication' },
    { href: '/permissions', title: 'Learn about Permissions' },
  ]}
>
  <Text
    >The easiest way to get started building with the Immich API is to <Link
      href="https://my.immich.app/user-settings?isOpen=api-keys">create an API key</Link
    >. Once you have an API key you can start using it to make requests with your favorite tool.
  </Text>

  <Text>Related to API keys is the idea of <Link href={ApiPage.Permissions}>permissions</Link></Text>

  <Alert color="success" title="Tip" icon={mdiLightbulbOnOutline}>
    <Text>Use the <Link href={ApiPage.Playground}>playground</Link> to explore the API with your API key</Text>
  </Alert>
</ApiPageContent>
