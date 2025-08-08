<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Introduction"
  description="The API that powers Immich"
  nextSteps={[
    { href: '/getting-started', title: 'Getting started' },
    { href: '/authorization', title: 'Learn about Authorization' },
  ]}
>
  <Text
    >Immich API is the REST application programming interface that allows developers to interact with the Immich server
    programmatically. Direct API access enables developers to build 3rd party integrations, features, tools, and apps.
  </Text>
</ApiPageContent>
