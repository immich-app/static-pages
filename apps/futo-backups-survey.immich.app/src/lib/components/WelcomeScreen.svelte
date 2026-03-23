<script lang="ts">
  import { PUBLIC_CF_TURNSTILE_SITE } from '$env/static/public';
  import { Button, Logo } from '@immich/ui';
  import { Turnstile } from 'svelte-turnstile';
  import { verifyTurnstile } from '$lib/api-client';

  interface Props {
    onStart: () => void;
  }

  let { onStart }: Props = $props();
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
  <Logo variant="stacked" size="giant" />

  <div class="flex max-w-[640px] flex-col gap-4 text-base">
    <h1 class="text-3xl font-bold">FUTO Backups</h1>

    <p class="text-gray-300">
      Hey, thanks for taking the time to fill out the FUTO Backups survey. We estimate this will
      take a maximum of 5 minutes of your time. As a thanks for completing this survey, you can
      provide your email at the end and we will invite you to the closed beta of the product when it
      launches, which will be free for the duration of the beta period.
    </p>

    <p class="text-gray-300">This survey is broken down in 6 sections;</p>

    <ol class="list-decimal space-y-1 pl-6 text-gray-300">
      <li>Questions about your immich server, your library and your internet speed</li>
      <li>Your current backup solution</li>
      <li>Questions about FUTO Backups - and your interest in it</li>
      <li>Private Beta Signup</li>
      <li>Additional questions about how you host Immich</li>
      <li>Final Thoughts</li>
    </ol>
  </div>

  <Turnstile
    siteKey={PUBLIC_CF_TURNSTILE_SITE}
    on:callback={(e) => verifyTurnstile(e.detail.token).catch(() => {})}
    on:error={() => {}}
  />

  <Button color="primary" onclick={onStart}>Get Started</Button>
</div>
