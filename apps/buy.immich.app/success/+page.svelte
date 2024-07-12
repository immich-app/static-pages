<script lang="ts">
  import LoadingSpinner from '$lib/components/loading-spinner.svelte';
  import { FUTO_ROUTES } from '$lib/utils/endpoints';
  import type { PageData } from '../$types';
  import { onMount } from 'svelte';

  enum PurchaseStatus {
    Pending = -1,
    Failed = 0,
    Succeeded = 1,
    Unknown = 2,
  }

  type PaymentStatusResponseDto = {
    status: PurchaseStatus;
    purchaseId?: string; // License key
  };

  export let data: PageData;

  let paymentStatus: PurchaseStatus = PurchaseStatus.Unknown;
  let setIntervalHandler: number;
  let setTimeoutHandler: number;
  let licenseKey: string;

  onMount(() => {
    if (data.orderId && data.instanceUrl) {
      setIntervalHandler = setInterval(() => {
        getPurchaseStatus(data.orderId);
      }, 5_000);

      setTimeoutHandler = setTimeout(() => {
        clearInterval(setIntervalHandler);
      }, 30_000);
    }

    return () => {
      clearTimers();
    };
  });

  const clearTimers = () => {
    clearInterval(setIntervalHandler);
    clearTimeout(setTimeoutHandler);
  };

  const getPurchaseStatus = async (orderId: string) => {
    const status = await fetch(new URL(orderId, FUTO_ROUTES.getPaymentStatus));

    if (status.ok) {
      const data = (await status.json()) as PaymentStatusResponseDto;

      if (data.status === PurchaseStatus.Succeeded && data.purchaseId) {
        licenseKey = data.purchaseId;
        paymentStatus = data.status;
        clearTimers();
        await getActivationKey(data.purchaseId);
      }

      if (data.status === PurchaseStatus.Failed) {
        paymentStatus = data.status;
        clearTimers();
      }

      if (data.status === PurchaseStatus.Pending) {
        console.log('Purchase is still pending');
      }
    }
  };

  const getActivationKey = async (licenkeyKey: string) => {
    const status = await fetch(new URL(licenkeyKey, FUTO_ROUTES.getActivationKey));

    if (status.ok) {
      const data = await status.text();

      console.log('activation key', data);
    }
  };
</script>

<svelte:head>
  <title>Immich - Purchase Success</title>
  <meta name="theme-color" content="currentColor" />
  <meta name="description" content="Buy a license to support Immich" />

  <!-- Facebook Meta Tags -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Immich Licenses" />
  <meta property="og:description" content="Buy a license to support Immich" />
  <meta property="og:image" content="/img/social-preview.png" />

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Immich Licenses" />
  <meta name="twitter:description" content="Buy a license to support Immich" />
  <meta name="twitter:image" content="/img/social-preview.png" />
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
    {#if paymentStatus === PurchaseStatus.Unknown}
      <div class="flex gap-4 flex-col place-content-center place-items-center text-center mt-4 justify-between">
        <LoadingSpinner />
        <p>Fetching purchase status</p>
      </div>
    {/if}

    {#if paymentStatus === PurchaseStatus.Succeeded}
      <div class="flex gap-4 flex-col place-content-center place-items-center text-center mt-4 justify-between">
        <p>License Key: {licenseKey}</p>
      </div>
    {/if}
  </section>
</div>
