<script lang="ts">
  import { Button, Logo } from '@immich/ui';

  async function startOver() {
    await fetch('/api/reset', { method: 'POST', credentials: 'same-origin' });
    globalThis.location.reload();
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
  <Logo variant="stacked" size="large" />

  <h1 class="text-3xl font-bold">You've already completed this survey</h1>
  <p class="text-gray-500">Your responses were recorded. Thank you for your feedback!</p>

  <Button variant="outline" onclick={startOver}>Start over</Button>
</div>
