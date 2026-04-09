<script lang="ts">
  import { Button, Input } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import { mdiLock, mdiOpenInNew } from '@mdi/js';
  import { passwordLogin, oidcLogin } from '$lib/api/auth';
  import { refreshAuth } from '$lib/stores/auth.svelte';

  interface Props {
    oidcEnabled: boolean;
    passwordEnabled: boolean;
  }

  let { oidcEnabled, passwordEnabled }: Props = $props();

  let password = $state('');
  let error = $state<string | null>(null);
  let submitting = $state(false);

  async function handlePasswordLogin(e: Event) {
    e.preventDefault();
    if (!password.trim()) return;
    submitting = true;
    error = null;
    try {
      await passwordLogin(password);
      await refreshAuth();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    }
    submitting = false;
  }
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-6">
  <div class="w-full max-w-sm">
    <div class="mb-8 flex flex-col items-center gap-3 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-800">
        <Icon icon={mdiLock} size="28" class="text-gray-400" />
      </div>
      <h1 class="text-xl font-bold">Sign in to FUTO Surveys</h1>
    </div>

    {#if passwordEnabled}
      <form onsubmit={handlePasswordLogin} class="space-y-4" aria-label="Sign in">
        <div>
          <Input type="password" bind:value={password} placeholder="Admin password" disabled={submitting} />
        </div>

        {#if error}
          <p class="text-sm text-red-400">{error}</p>
        {/if}

        <Button color="primary" type="submit" disabled={submitting || !password.trim()}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    {/if}

    {#if oidcEnabled}
      {#if passwordEnabled}
        <div class="my-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-700"></div>
          <span class="text-xs text-gray-500">or</span>
          <div class="h-px flex-1 bg-gray-700"></div>
        </div>
      {/if}

      <Button variant="outline" onclick={() => oidcLogin(window.location.pathname)}>
        <Icon icon={mdiOpenInNew} size="16" />
        Sign in with SSO
      </Button>
    {/if}

    {#if !passwordEnabled && !oidcEnabled}
      <p class="text-center text-sm text-red-400">No authentication methods are configured.</p>
    {/if}
  </div>
</div>
