<script lang="ts">
  import { CodeBlock, Container, Logo, Stack, Text } from '@immich/ui';

  type Props = {
    error?: { message: string; code?: string | number; stack?: string } | undefined | null;
  };

  let { error = undefined }: Props = $props();
</script>

<Container size="full" center class="h-dvh">
  <div class="border-subtle border-b p-2">
    <a class="flex place-items-center gap-2 hover:cursor-pointer" href="/photos">
      <Logo variant="inline" />
    </a>
  </div>

  <div class="p-4">
    <Stack gap={4}>
      <Text color="danger">🚨 {error?.message}</Text>

      {#if error?.stack}
        <div>
          <CodeBlock code={error.stack || 'No stack'} />
        </div>
      {/if}
    </Stack>
  </div>
</Container>
