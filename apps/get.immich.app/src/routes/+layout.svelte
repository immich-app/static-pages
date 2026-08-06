<script lang="ts">
  import PageContent from '$common/components/PageContent.svelte';
  import '$lib/app.css';
  import {
    AppShell,
    AppShellHeader,
    ControlBar,
    ControlBarContent,
    Logo,
    SupporterBadge,
    Text,
    ThemeSwitcher,
    TooltipProvider,
  } from '@immich/ui';

  let { children } = $props();
</script>

<TooltipProvider>
  <AppShell>
    <AppShellHeader class="w-full items-stretch">
      <ControlBar variant="ghost" static class="h-full items-stretch gap-0 px-0">
        <ControlBarContent class="items-stretch">
          <SupporterBadge effect="always" class="w-full justify-between rounded-none px-4 py-0">
            <a href="/" class="flex items-center gap-3">
              <Logo size="large" variant="icon" />
              <Text size="giant" color="primary" fontWeight="bold" class="text-2xl">Get Immich</Text>
            </a>
            <ThemeSwitcher />
          </SupporterBadge>
        </ControlBarContent>
      </ControlBar>
    </AppShellHeader>
    <PageContent>
      {@render children()}
    </PageContent>
  </AppShell>
</TooltipProvider>
