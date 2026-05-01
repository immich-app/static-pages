<script lang="ts">
  import Lorem from '$lib/components/Lorem.svelte';
  import { Markdown, Text } from '@immich/ui';
</script>

<Text class="mb-1" fontWeight="bold">Alert</Text>

<Markdown.Alert variant="note">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="tip">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="important">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="caution">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="success">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="info">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="warning">
  <Lorem />
</Markdown.Alert>

<Markdown.Alert variant="danger">
  <Lorem />
</Markdown.Alert>
