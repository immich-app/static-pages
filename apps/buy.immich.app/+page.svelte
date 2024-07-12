<script lang="ts">
  import '$lib/app.css';
  import Button from '$lib/components/button.svelte';
  import Icon from '$lib/components/icon.svelte';
  import { mdiCheckCircleOutline, mdiServer, mdiAccount } from '@mdi/js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const redirectUrl = FUTO_ROUTES.paymentPortal;
  const immichBuyBase = new URL('http://10.1.15.216:5173');

  onMount(() => {
    if (data.productId && data.instanceUrl) {
      console.log('Navigating to FUTO Pay');

      immichBuyBase.searchParams.append('instanceUrl', data.instanceUrl);

      redirectUrl.searchParams.append('product', data.productId);
      redirectUrl.searchParams.append('success', immichBuyBase.href);

      window.location.href = redirectUrl.href;
    }
  });
</script>

<div class="w-full h-full md:max-w-[900px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <div class="m-auto">
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">LICENSE</h1>
    <p class="text-lg mt-2 dark:text-immich-gray">Buy a license to support Immich</p>
  </div>

  <section class="flex justify-center mt-6">
    <img src="/img/social-preview.png" alt="Sociel Preview" class="rounded-3xl" />
  </section>

  <section class="mt-10">
    <div class="flex gap-6 mt-4 justify-between flex-wrap lg:flex-nowrap">
      <!-- SERVER LICENSE -->
      <div
        class="border border-gray-300 dark:border-gray-800 w-full p-8 rounded-3xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
      >
        <div class="text-immich-primary dark:text-immich-dark-primary">
          <Icon path={mdiServer} size="56" />
          <p class="font-semibold text-lg mt-1">Server License</p>
        </div>

        <div class="mt-4 dark:text-immich-gray">
          <p class="text-6xl font-bold">$99<span class="text-2xl font-medium">.99</span></p>
          <p>per server</p>
        </div>

        <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
          <div class="mt-6 flex flex-col gap-1">
            <div class="grid grid-cols-[36px_auto]">
              <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
              <p class="self-center">1 license per server</p>
            </div>

            <div class="grid grid-cols-[36px_auto]">
              <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
              <p class="self-center">Lifetime license</p>
            </div>

            <div class="grid grid-cols-[36px_auto]">
              <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
              <p class="self-center">License for all users on the server</p>
            </div>
          </div>
          <Button fullwidth>Select</Button>
        </div>
      </div>

      <!-- USER LICENSE -->
      <div
        class="border border-gray-300 dark:border-gray-800 w-full p-8 rounded-3xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20"
      >
        <div class="text-immich-primary dark:text-immich-dark-primary">
          <Icon path={mdiAccount} size="56" />
          <p class="font-semibold text-lg mt-1">Individual License</p>
        </div>

        <div class="mt-4 dark:text-immich-gray">
          <p class="text-6xl font-bold">$24<span class="text-2xl font-medium">.99</span></p>
          <p>per user</p>
        </div>

        <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
          <div class="mt-6 flex flex-col gap-1">
            <div class="grid grid-cols-[36px_auto]">
              <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
              <p class="self-center">1 license per user on any server</p>
            </div>

            <div class="grid grid-cols-[36px_auto]">
              <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
              <p class="self-center">Lifetime license</p>
            </div>
          </div>

          <div>
            <Button fullwidth>Select</Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
