<script lang="ts">
  import { Button, Input } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import { mdiLock } from '@mdi/js';

  interface Props {
    surveyTitle?: string;
    onSubmit: (password: string) => Promise<void>;
  }

  let { surveyTitle, onSubmit }: Props = $props();
  let password = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!password.trim()) return;
    submitting = true;
    error = null;
    try {
      await onSubmit(password);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Incorrect password';
    }
    submitting = false;
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6">
  <div class="w-full max-w-sm">
    <div class="mb-6 flex flex-col items-center gap-3 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800">
        <Icon icon={mdiLock} size="28" class="text-gray-400" />
      </div>
      {#if surveyTitle}
        <h1 class="text-xl font-bold">{surveyTitle}</h1>
      {/if}
      <p class="text-sm text-gray-500">This survey is password protected</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div>
        <Input type="password" bind:value={password} placeholder="Enter password" disabled={submitting} />
      </div>

      {#if error}
        <p class="text-sm text-red-400">{error}</p>
      {/if}

      <Button color="primary" type="submit" disabled={submitting || !password.trim()}>
        {submitting ? 'Verifying...' : 'Continue'}
      </Button>
    </form>
  </div>
</div>
