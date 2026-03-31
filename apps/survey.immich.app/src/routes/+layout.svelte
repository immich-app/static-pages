<script lang="ts">
  import '$lib/app.css';
  import { TooltipProvider } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { initAuth, getAuth } from '$lib/stores/auth.svelte';
  import UserMenu from '$lib/components/layout/UserMenu.svelte';
  import SetupScreen from '$lib/components/auth/SetupScreen.svelte';
  import LoginScreen from '$lib/components/auth/LoginScreen.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  const auth = getAuth();

  // Public routes that don't require auth
  const isPublicRoute = $derived(
    page.url.pathname.startsWith('/s/') || page.url.pathname.startsWith('/embed/'),
  );

  onMount(() => {
    initAuth();
  });
</script>

<TooltipProvider>
  {#if isPublicRoute}
    <!-- Public survey-taking routes — no auth needed -->
    {@render children?.()}
  {:else if auth.loading}
    <div class="flex min-h-screen items-center justify-center">
      <div class="border-t-immich-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-600"></div>
    </div>
  {:else if auth.needsSetup}
    <SetupScreen />
  {:else if !auth.isAuthenticated}
    <LoginScreen oidcEnabled={auth.oidcEnabled} passwordEnabled={auth.passwordEnabled} />
  {:else}
    <header class="flex items-center justify-between border-b border-gray-200 px-6 py-3 dark:border-gray-700/80">
      <a href="/" class="text-lg font-semibold tracking-tight">Immich Surveys</a>
      <UserMenu />
    </header>
    {@render children?.()}
  {/if}
</TooltipProvider>
