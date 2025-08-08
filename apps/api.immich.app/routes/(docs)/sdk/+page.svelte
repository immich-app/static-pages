<script lang="ts">
  import ApiPageContent from '$lib/api/components/ApiPageContent.svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import { ApiPage } from '$lib/utils/api';
  import { Code, Heading, Link, Text } from '@immich/ui';
  import { bash } from 'svelte-highlight/languages';
  import typescript from 'svelte-highlight/languages/typescript';

  const code = `import { getAllAlbums, getMyUser, init } from "@immich/sdk";

const API_KEY = "<API_KEY>"; // process.env.IMMICH_API_KEY

init({ baseUrl: "https://demo.immich.app/api", apiKey: API_KEY });`;
</script>

<ApiPageContent
  title="@immich/sdk"
  description="Learn about the auto-generated SDK"
  nextSteps={[
    { href: 'https://www.npmjs.com/package/@immich/sdk', title: 'View on npm' },
    { href: ApiPage.Endpoints, title: 'View API endpoints' },
  ]}
>
  <Text
    >There are lots of tools to auto-generate software development kits (SDK) from <Link
      href="https://swagger.io/specification/">OpenAPI Specification</Link
    > documents. Immich uses <Link href="https://github.com/oazapfts/oazapfts">oazapfts</Link> to generate a TypeScript SDK,
    and publishes it to <Link href="https://www.npmjs.com/">npm</Link> as <Link
      href="https://www.npmjs.com/package/@immich/sdk">@immich/sdk</Link
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
      >To initialize the SDK, call <Code variant="filled" class="p-1">init</Code> with an API key. Once initialized, import
      typed methods, which use the <Code variant="filled" class="p-1">operationId</Code> from the specification.</Text
    >
    <CodeBlock {code} language={typescript} />
  </section>
</ApiPageContent>
