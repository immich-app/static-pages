<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiLogout } from '@mdi/js';
  import { getAuth } from '$lib/stores/auth.svelte';
  import { logout } from '$lib/api/auth';

  const auth = getAuth();

  const roleBadge: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-400',
    editor: 'bg-blue-500/10 text-blue-400',
    viewer: 'bg-gray-500/10 text-gray-400',
  };
</script>

{#if auth.loading}
  <div class="h-8 w-20 animate-pulse rounded-md bg-gray-800"></div>
{:else if auth.isAuthenticated && auth.user}
  <div class="flex items-center gap-2">
    <span
      class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase {roleBadge[auth.user.role] ??
        roleBadge.viewer}"
    >
      {auth.user.role}
    </span>
    <span class="text-sm text-gray-300">{auth.user.name || auth.user.email}</span>
    <button
      class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
      onclick={() => logout()}
      title="Log out"
    >
      <Icon icon={mdiLogout} size="16" />
    </button>
  </div>
{/if}
