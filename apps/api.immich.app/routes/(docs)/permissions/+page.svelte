<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import { ApiPage } from '$lib/utils/api';
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
    required permission for each endpoint on the <Link href={ApiPage.Endpoints}>endpoints</Link> overview page, as well as
    each endpoint's detail page.
  </Text>
</ApiPageContent>
