<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Getting Started"
  description="Learn how to authorize your requests to the Immich API"
  nextSteps={[
    { href: '/authorization', title: 'Learn about Authorization' },
    { href: '/permissions', title: 'Learn about Permissions' },
  ]}
>
  <Text>
    The Immich API uses token-based authentication. To access protected resources, you need to include a valid API key
    in your requests.
  </Text>

  <Text
    >Immich API is the REST application programming interface that allows developers to interact with the Immich server
    programmatically. Direct API access enables developers to build 3rd party integrations, features, tools, and apps.
  </Text>
</ApiPageContent>
