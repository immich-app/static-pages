<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Card, CardBody, Code, Heading, Link, Text } from '@immich/ui';
</script>

<ApiPageContent
  title="@immich/sdk"
  description="Learn about the auto-generated SDK"
  nextSteps={[
    { href: 'https://www.npmjs.com/package/@immich/sdk', title: 'View on npm' },
    { href: '/endpoints', title: 'View API endpoints' },
  ]}
>
  <Text
    >There are lots of tools to auto-generate software development kits (SDK) from OpenAPI specification documents.
    Immich uses <Link href="https://github.com/oazapfts/oazapfts">oazapfts</Link> to generate a TypeScript SDK, and publishes
    it to <Link href="https://www.npmjs.com/">npm</Link> as <Link href="https://www.npmjs.com/package/@immich/sdk"
      >@immich/sdk</Link
    ></Text
  >

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Install</Heading>
    <Card color="secondary">
      <CardBody>
        <Code>npm i --save @immich/sdk</Code>
      </CardBody>
    </Card>
  </section>
</ApiPageContent>
