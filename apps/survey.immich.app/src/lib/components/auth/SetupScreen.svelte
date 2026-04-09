<script lang="ts">
  import { Button, Input } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import { mdiShieldLock } from '@mdi/js';
  import { setup } from '$lib/api/auth';
  import { refreshAuth } from '$lib/stores/auth.svelte';

  let password = $state('');
  let confirmPassword = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;

    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    submitting = true;
    try {
      await setup(password);
      await refreshAuth();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Setup failed';
    }
    submitting = false;
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6">
  <div class="w-full max-w-sm">
    <div class="mb-8 flex flex-col items-center gap-3 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
        <Icon icon={mdiShieldLock} size="32" class="text-immich-primary" />
      </div>
      <h1 class="text-2xl font-bold">Welcome to FUTO Surveys</h1>
      <p class="text-sm text-gray-500">Set up your admin password to get started.</p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4" aria-label="Create admin account">
      <div>
        <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Password</label>
        <Input type="password" bind:value={password} placeholder="At least 8 characters" disabled={submitting} />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Confirm password</label>
        <Input type="password" bind:value={confirmPassword} placeholder="Confirm password" disabled={submitting} />
      </div>

      {#if error}
        <p class="text-sm text-red-400">{error}</p>
      {/if}

      <Button color="primary" type="submit" disabled={submitting || !password || !confirmPassword}>
        {submitting ? 'Setting up...' : 'Create Admin Account'}
      </Button>
    </form>
  </div>
</div>
