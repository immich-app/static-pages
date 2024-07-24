<script lang="ts">
  import Icon from '$lib/components/icon.svelte';
  import LoadingSpinner from '$lib/components/loading-spinner.svelte';
  import { getPaymentStatus, getRedirectUrl, PurchaseStatus, type PaymentStatusResponseDto } from '$lib/utils/license';
  import { mdiAlertCircleOutline, mdiCheckCircleOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  export let data: PageData;
  let intervalId: ReturnType<typeof setInterval>;
  let isLoading = true;
  let response: PaymentStatusResponseDto = { status: PurchaseStatus.Unknown };

  const clearTimers = () => {
    clearInterval(intervalId);
  };

  const refresh = async (orderId: string) => {
    const newResponse = await getPaymentStatus(orderId);
    if (!newResponse) {
      return;
    }

    response = newResponse;

    switch (response.status) {
      case PurchaseStatus.Failed:
        isLoading = false;
        break;
      case PurchaseStatus.Succeeded:
        isLoading = false;
        if (data.instanceUrl && response.purchaseId) {
          const url = getRedirectUrl(response.purchaseId, data.instanceUrl);
          setTimeout(() => (window.location.href = url), 2000);
        }
        break;
      default:
        break;
    }
  };

  refresh(data.orderId);
  setTimeout(() => (isLoading = false), 30_000);

  intervalId = setInterval(() => {
    if (isLoading) {
      refresh(data.orderId);
    } else {
      clearTimers();
    }
  }, 5_000);

  onMount(() => {
    return () => clearTimers();
  });
</script>

<svelte:head>
  <title>Immich - Purchase Success</title>
</svelte:head>

<div class="w-full h-full md:max-w-[900px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <div class="m-auto">
    <h1 class="text-4xl font-bold text-immich-primary dark:text-immich-dark-primary tracking-wider">PURCHASE STATUS</h1>
    <p class="text-lg mt-2 dark:text-immich-gray">Processing your purchase</p>
  </div>

  <section class="flex justify-center mt-6">
    <img src="/img/social-preview.png" alt="Sociel Preview" class="rounded-3xl" />
  </section>

  <section class="mt-10">
    <div
      class="flex gap-4 flex-col place-content-center place-items-center text-center mt-4 justify-between relative border p-10 rounded-3xl bg-gray-100"
    >
      <div class="absolute -top-[24px] left-[calc(50%-24px)]">
        {#if isLoading}
          <div class="bg-immich-bg rounded-full p-1 border">
            <LoadingSpinner size="48" />
          </div>
        {:else}
          <!-- abc -->
          {#if response.status === PurchaseStatus.Succeeded}
            <div in:fade={{ duration: 200 }}>
              <Icon path={mdiCheckCircleOutline} size="48" class="text-white rounded-full bg-immich-primary" />
            </div>
          {:else}
            <div in:fade={{ duration: 200 }}>
              <Icon path={mdiAlertCircleOutline} size="48" class="text-white rounded-full bg-red-500" />
            </div>
          {/if}
        {/if}
      </div>

      {#if isLoading}
        <p>Getting payment status</p>
      {:else}
        {#if response.status === PurchaseStatus.Pending}
          <p>
            Purchase is still pending, please check your email after a few minutes for the license key. Payment can take
            up to 48 hours in some cases, depending on payment provider
          </p>
        {/if}

        {#if response.status === PurchaseStatus.Failed || response.status === PurchaseStatus.Unknown}
          <p>Fail to get payment status, please check your email for more details</p>
        {/if}

        {#if response.status === PurchaseStatus.Succeeded}
          {#if response.purchaseId}
            {#if data.instanceUrl}
              <div class="flex gap-2 place-items-center place-content-center">
                <LoadingSpinner />
                <p>Redirecting back to your instance, click on the button below if you aren't navigated back</p>
              </div>

              <a href={getRedirectUrl(response.purchaseId, data.instanceUrl)}>
                <button
                  class="mt-2 p-4 bg-immich-primary text-white rounded-full dark:text-black dark:bg-immich-dark-primary hover:shadow-xl"
                  >Activate your instance</button
                >
              </a>
            {:else}
              <p class="text-lg font-bold">Your License Key</p>
              <div class="bg-immich-primary/10 text-immich-primary py-4 px-8 rounded-lg">{response.purchaseId}</div>
              <a href={getRedirectUrl(response.purchaseId, 'https://my.immich.app')}>
                <button
                  class="mt-2 p-4 bg-immich-primary text-white rounded-full dark:text-black dark:bg-immich-dark-primary hover:shadow-xl"
                  >Activate your instance</button
                >
              </a>
              <p class="text-sm mt-4">The license key is also sent to the email you provided</p>
            {/if}
          {/if}
        {/if}
      {/if}
    </div>
  </section>
</div>
