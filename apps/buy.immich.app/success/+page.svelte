<script lang="ts">
  import InternalCard from '$lib/components/card.svelte';
  import LicenseKey from '$lib/components/license-key.svelte';
  import LoadingSpinner from '$lib/components/loading-spinner.svelte';
  import { getPaymentStatus, getRedirectUrl, PurchaseStatus, type PaymentStatusResponseDto } from '$lib/utils/license';
  import { Button, Card, Heading, Text, VStack } from '@immich/ui';
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
  <section>
    <Heading size="giant" color="primary" class="uppercase">Purchase Status</Heading>
    <Text size="large">Processing your purchase</Text>
  </section>

  <Card class="mt-6">
    <img src="/img/social-preview.webp" alt="Social Preview" />
  </Card>

  <section class="mt-10">
    <InternalCard status={isLoading ? 'loading' : response.status === PurchaseStatus.Succeeded ? 'success' : 'error'}>
      {#if isLoading}
        <Text>Getting payment status</Text>
      {:else}
        {#if response.status === PurchaseStatus.Pending}
          <Text
            >Purchase is still pending, please check your email after a few minutes for the product key. Payment can
            take up to 48 hours in some cases, depending on payment provider
          </Text>
        {/if}

        {#if response.status === PurchaseStatus.Failed || response.status === PurchaseStatus.Unknown}
          <Text>Fail to get payment status, please check your email for more details</Text>
        {/if}

        {#if response.status === PurchaseStatus.Succeeded}
          {#if response.purchaseId}
            {#if data.instanceUrl}
              <div class="flex gap-2 place-items-center place-content-center">
                <LoadingSpinner />
                <Text>Redirecting back to your instance, click on the button below if you aren't navigated back</Text>
              </div>
              <Button href={getRedirectUrl(response.purchaseId, data.instanceUrl)} size="large"
                >Activate your instance</Button
              >
            {:else}
              <VStack>
                <LicenseKey productKey={response.purchaseId} />
                <Text size="small">The product key is also sent to the email you provided</Text>
              </VStack>
            {/if}
          {/if}
        {/if}
      {/if}
    </InternalCard>
  </section>
</div>
