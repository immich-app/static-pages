<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Link, Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Permissions"
  description="Learn how permissions and access controls work in the Immich API"
  nextSteps={[
    { href: '/api/endpoints', title: 'Endpoint overview' },
    { href: '/playground', title: 'Try the playground' },
  ]}
>
  <Text>
    Most of the <Link href="/api/endpoints">endpoints</Link> require a specific permission to access. You can find the required
    permission for each endpoint on the <Link href="/api/endpoints">endpoints</Link> overview page, as well as each endpoint's
    detail page.
  </Text>
</ApiPageContent>
