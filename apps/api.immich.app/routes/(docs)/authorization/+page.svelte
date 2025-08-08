<script lang="ts">
  import ApiPageContent from '$lib/components/ApiPageContent.svelte';
  import ApiConfigureModal from '$lib/modals/ApiConfigureModal.svelte';
  import { Button, Card, CardBody, Code, Heading, modalManager, Text } from '@immich/ui';

  const handleConnect = async () => {
    const results = await modalManager.show(ApiConfigureModal);
    if (results) {
      console.log(results);
    }
  };
</script>

<ApiPageContent
  title="Authorization"
  description="Learn how to authorize your requests to the Immich API"
  nextSteps={[
    { href: '/permissions', title: 'Learn about permissions' },
    { href: '/endpoints', title: 'View API endpoints' },
  ]}
>
  <section class="flex flex-col gap-2">
    <Heading tag="h2">Overview</Heading>
    <Text>
      While some endpoints do not require authentication, the majority do. In order to authenticate a request, the
      Immich API supports a few different schemes: session, shared-key, and api-key. 3rd party applications are
      encouraged to use api-keys, which support fine-grained permissions.
    </Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">API Keys</Heading>
    <Text>
      In order to authenticate a request with an API key, you need to include the <Code color="info"
        >x-immich-api-key</Code
      > header in your request.
    </Text>
    <Card color="secondary" class="mt-2">
      <CardBody>
        <Code>x-immich-api-key: &lt;apiKey&gt;</Code>
      </CardBody>
    </Card>
    <Text class="pt-4">
      Alternatively, you can also include the API key by using the <Code color="info">apiKey</Code> query parameter in your
      request.
    </Text>
    <Card color="secondary" class="mt-2">
      <CardBody>
        <Code>https://demo.immich.app/api/assets?apiKey=&lt;apiKey&gt;</Code>
      </CardBody>
    </Card>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2">Configure</Heading>
    <Text>
      You can connect this website to your Immich API by clicking the button below. Once connected, you will be able to
      use to view the API endpoints and test them directly from this website.
    </Text>
    <div class="mt-4">
      <Button size="large" color="secondary" onclick={() => handleConnect()}>Configure</Button>
    </div>
  </section>
</ApiPageContent>
