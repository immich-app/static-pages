<script lang="ts">
  import Card from '$lib/components/card.svelte';
  import LicenseKey from '$lib/components/license-key.svelte';
  import LoadingSpinner from '$lib/components/loading-spinner.svelte';
  import { getPaymentStatus, getRedirectUrl, PurchaseStatus, type PaymentStatusResponseDto } from '$lib/utils/license';
  import { Button } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  let intervalId: ReturnType<typeof setInterval>;
  let isLoading = $state(true);
  let response: PaymentStatusResponseDto = $state({ status: PurchaseStatus.Unknown });

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
    <img src="/img/social-preview.webp" alt="Sociel Preview" class="rounded-lg" />
  </section>

  <section class="mt-10">
    <Card status={isLoading ? 'loading' : response.status === PurchaseStatus.Succeeded ? 'success' : 'error'}>
      {#if isLoading}
        <p>Getting payment status</p>
      {:else}
        {#if response.status === PurchaseStatus.Pending}
          <p>
            Purchase is still pending, please check your email after a few minutes for the product key. Payment can take
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
              <Button href={getRedirectUrl(response.purchaseId, data.instanceUrl)} size="large"
                >Activate your instance</Button
              >
            {:else}
              <LicenseKey productKey={response.purchaseId} />
              <p class="text-sm mt-4">The product key is also sent to the email you provided</p>
            {/if}
          {/if}
        {/if}
      {/if}
    </Card>
  </section>
</div>
