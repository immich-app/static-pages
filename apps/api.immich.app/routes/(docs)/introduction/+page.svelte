<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import { Heading, Link, Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Introduction"
  description="The API that powers Immich"
  nextSteps={[
    { href: '/getting-started', title: 'Getting started' },
    { href: '/authentication', title: 'Learn about Authentication' },
  ]}
>
  <Text
    >Immich API refers to the REST interface that allows developers to interact with the Immich server programmatically.
    This access enables 3rd parties to extend Immich, implement additional tools & utilities, as well as create custom
    integrations. Many such projects already exist, and several of them can be found in the <Link
      href="https://immich.app/docs/community-projects">Community Projects</Link
    > section of the main website.
  </Text>

  <section class="flex flex-col gap-2">
    <Heading tag="h2" size="large">OpenAPI</Heading>
    <Text
      >Immich uses tooling to automatically generate an <Link href="https://swagger.io/specification/"
        >OpenAPI Specification</Link
      > document, which describes request and response structures, as well as the authentication requirements each endpoint.
      From this document, we auto-generate much of this site. Additionally, there are existing tools that can generate software
      development kits (SDKs) to more easily integrate with application code, from the specification as well.</Text
    >
  </section>
</ApiPageContent>
