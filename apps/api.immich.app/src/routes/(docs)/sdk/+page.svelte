<script lang="ts">
  import { ApiPage } from '$lib';
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import { Code, CodeBlock, Constants, Heading, Link, Text } from '@immich/ui';
  import { bash } from 'svelte-highlight/languages';

  const code = `import { getAllAlbums, getMyUser, init } from "@immich/sdk";

const API_KEY = "<API_KEY>"; // process.env.IMMICH_API_KEY

init({ baseUrl: "https://demo.immich.app/api", apiKey: API_KEY });`;
</script>

<ApiPageContent
  title="@immich/sdk"
  description="Learn about the auto-generated SDK"
  nextSteps={[
    { href: Constants.Npm.Sdk, title: 'View on npm' },
    { href: ApiPage.Endpoints, title: 'View API endpoints' },
  ]}
>
  <Text
    >There are lots of tools to auto-generate software development kits (SDK) from <Link
      href="https://swagger.io/specification/">OpenAPI Specification</Link
    > documents. Immich uses <Link href="https://github.com/oazapfts/oazapfts">oazapfts</Link> to generate a TypeScript SDK,
    and publishes it to <Link href="https://www.npmjs.com/">npm</Link> as <Link href={Constants.Npm.Sdk}
      >@immich/sdk</Link
    >.
  </Text>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Install</Heading>
    <Text>To install the SDK, run the following npm command:</Text>
    <CodeBlock code="npm i --save @immich/sdk" language={bash} />
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Usage</Heading>
    <Text
      >To initialize the SDK, call <Code>init</Code> with an API key. Once initialized, import typed methods, which use the
      <Code>operationId</Code> from the specification.</Text
    >
    <CodeBlock {code} />
  </section>
</ApiPageContent>
