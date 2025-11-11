<script>
  import { page } from '$app/state';
  import ErrorLayout from '$lib/components/ErrorLayout.svelte';
</script>

<ErrorLayout error={page.error} />
