<script lang="ts">
  import LicenseKey from '$lib/components/LicenseKey.svelte';
  import { getPaymentStatus, getRedirectUrl, PurchaseStatus, type PaymentStatusResponseDto } from '$lib/utils/license';
  import { Alert, Button, LoadingSpinner, Card, CardBody, Heading, Stack, Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import DefaultPageLayout from '$lib/components/DefaultPageLayout.svelte';

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

<DefaultPageLayout>
  <Stack gap={4}>
    <section>
      <Heading size="giant" color="primary" class="uppercase">Purchase Status</Heading>
      <Text size="large">Processing your purchase</Text>
    </section>

    {#if isLoading}
      <Card variant="subtle" color="secondary">
        <CardBody>
          <section class="flex gap-2">
            <Text>Waiting for payment verification...</Text>
            <LoadingSpinner />
          </section>
        </CardBody>
      </Card>
    {:else}
      {#if response.status === PurchaseStatus.Pending}
        <Alert title="Pending purchase" color="secondary">
          <Text
            >Purchase is still pending, please check your email after a few minutes for the product key. Payment can
            take up to 48 hours in some cases, depending on payment provider.
          </Text>
        </Alert>
      {/if}

      {#if response.status === PurchaseStatus.Failed || response.status === PurchaseStatus.Unknown}
        <Alert title="Failed to verify payment" color="danger">
          <Text>Unable to verify payment status. Please check your email for more details.</Text>
        </Alert>
      {/if}

      {#if response.status === PurchaseStatus.Succeeded}
        {#if response.purchaseId}
          {#if data.instanceUrl}
            <Alert title="Success" color="success">
              <Text
                >You will now be redirected back to your instance. Click the button below to navigate immediately.</Text
              >
              <div class="flex w-full">
                <Button href={getRedirectUrl(response.purchaseId, data.instanceUrl)} variant="outline" color="secondary"
                  >Activate your instance</Button
                >
              </div>
            </Alert>
          {:else}
            <Alert title="Success" color="success">
              <Text>Thank you for doing your part to support Immich and open-source software.</Text>
              <Text size="small">Note: the product key is also sent to the email you provided.</Text>
            </Alert>
            <LicenseKey productKey={response.purchaseId} />
          {/if}
        {/if}
      {/if}
    {/if}
  </Stack>
</DefaultPageLayout>
