<script lang="ts">
  import { Button, Card, CardBody, CardHeader, CardTitle, Icon, Stack } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    icon: string;
    title: string;
    description: Snippet;
    href?: string;
  };

  const { icon, title, description, href }: Props = $props();
</script>

<Card color="secondary">
  <CardHeader>
    <CardTitle class="flex items-center gap-2 align-middle">
      <Icon {icon} />
      <span>{title}</span>
    </CardTitle>
  </CardHeader>
  <CardBody>
    <Stack gap={4}>
      {@render description()}
      {#if href}
        <Button {href} fullWidth color="primary">Contribute</Button>
      {/if}
    </Stack>
  </CardBody>
</Card>
