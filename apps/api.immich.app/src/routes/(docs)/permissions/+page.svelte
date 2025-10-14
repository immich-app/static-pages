<script lang="ts">
  import { ApiPage } from '$lib';
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Link, Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Permissions"
  description="Learn how permissions and access controls work in the Immich API"
  nextSteps={[
    { href: ApiPage.Endpoints, title: 'Endpoint overview' },
    { href: ApiPage.Models, title: 'Model overview' },
  ]}
>
  <Text>
    Most of the <Link href={ApiPage.Endpoints}>endpoints</Link> require a specific permission to access. You can find the
    required permission for each endpoint in each endpoint's detail page, towards the top.
  </Text>
</ApiPageContent>
