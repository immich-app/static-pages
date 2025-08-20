<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { Heading, Link, Text } from '@immich/ui';
</script>

<ApiPageContent
  title="Introduction"
  description="The API that powers Immich"
  nextSteps={[
    { href: ApiPage.GettingStarted, title: 'Getting started' },
    { href: ApiPage.Authentication, title: 'Learn about Authentication' },
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
      > document, which describes request and response structures, as well as the authentication requirements for each endpoint.
      From this document, Immich auto-generates the <Link href={ApiPage.Sdk}>@immich/sdk</Link> package, as well as the
      <Link href={ApiPage.Endpoints}>Endpoints</Link> and <Link href={ApiPage.Models}>Models</Link> pages.
    </Text>
  </section>
</ApiPageContent>
