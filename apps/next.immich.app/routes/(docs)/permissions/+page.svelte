<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { ApiPage } from '$lib/utils/api';
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
    Most of the <Link href={ApiPage.ApiEndpoints}>endpoints</Link> require a specific permission to access. You can find
    the required permission for each endpoint on the <Link href={ApiPage.ApiEndpoints}>endpoints</Link> overview page, as
    well as each endpoint's detail page.
  </Text>
</ApiPageContent>
