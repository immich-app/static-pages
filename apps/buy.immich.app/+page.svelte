<script lang="ts">
  import '$lib/app.css';
  import { Button, Logo } from '@immich/ui';
  import Icon from '$lib/components/icon.svelte';
  import { mdiCheckCircleOutline, mdiServer, mdiAccount } from '@mdi/js';
  import { getCallbackUrl, ImmichLicense } from '$lib/utils/license';
</script>

<div class="w-full h-full md:max-w-[900px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <div class="m-auto">
    <div
      class="flex gap-4 mt-2 place-items-center dark:bg-immich-dark-primary/10 bg-gray-200/50 py-4 px-6 border rounded-lg overflow-hidden supporter-effect transition-all"
    >
      <Logo />
      <p class="dark:text-gray-100 text-2xl font-medium text-immich-primary">Purchase Immich</p>
    </div>
    <section class="mt-6">
      <div class="flex gap-6 mt-4 justify-between flex-wrap lg:flex-nowrap">
        <!-- SERVER -->
        <div
          class="border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
        >
          <div class="hidden md:block text-immich-primary dark:text-immich-dark-primary">
            <Icon path={mdiServer} size="56" />
            <p class="font-semibold text-lg mt-1">Server</p>
          </div>

          <div class="mt-4 dark:text-immich-gray">
            <p class="text-6xl font-bold">$100</p>
            <p>per server</p>
          </div>

          <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
            <div class="mt-6 flex flex-col gap-1">
              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">For the whole server</p>
              </div>

              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">Lifetime purchase</p>
              </div>

              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">Supporter status</p>
              </div>
            </div>

            <Button href={getCallbackUrl(ImmichLicense.Server)} fullWidth size="large">Select</Button>
          </div>
        </div>

        <!-- INDIVIDUAL -->
        <div
          class="border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20"
        >
          <div class="hidden md:block text-immich-primary dark:text-immich-dark-primary">
            <Icon path={mdiAccount} size="56" />
            <p class="font-semibold text-lg mt-1">Individual</p>
          </div>

          <div class="mt-4 dark:text-immich-gray">
            <p class="text-6xl font-bold">$25</p>
            <p>per user</p>
          </div>

          <div class="flex flex-col justify-between h-[200px] dark:text-immich-gray">
            <div class="mt-6 flex flex-col gap-1">
              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">For an individual</p>
              </div>

              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">Lifetime purchase</p>
              </div>

              <div class="grid grid-cols-[36px_auto]">
                <Icon path={mdiCheckCircleOutline} size="24" class="text-green-500 self-center" />
                <p class="self-center">Supporter status</p>
              </div>
            </div>

            <Button href={getCallbackUrl(ImmichLicense.Individual)} fullWidth size="large">Select</Button>
          </div>
        </div>
      </div>
    </section>

    <div class="text-gray-800 dark:text-white my-10">
      <p>
        Building Immich takes a lot of time and effort, and we have full-time engineers working on it to make it as good
        as we possibly can.
      </p>
      <br />
      <p>
        Our mission is for open-source software and ethical business practices to become a sustainable income source for
        developers and to create a privacy-respecting ecosystem with real alternatives to exploitative cloud services.
      </p>
      <br />
      <p>
        As we’re committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
        rely on users like you to support Immich’s ongoing development.
      </p>
    </div>
  </div>
</div>

<style>
  /* Supporter Effect */
  .supporter-effect {
    position: relative;
    border: 0px solid transparent;
    background-clip: padding-box;
    animation: gradient 10s ease infinite;
    z-index: 1;
    box-shadow:
      rgba(0, 0, 0, 0.1) 0px 0px 5px 0px,
      rgba(0, 0, 0, 0.1) 0px 0px 1px 0px;
  }

  .supporter-effect:after {
    position: absolute;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
    background: linear-gradient(
      to right,
      rgba(16, 132, 254, 0.15),
      rgba(229, 125, 175, 0.15),
      rgba(254, 36, 29, 0.15),
      rgba(255, 183, 0, 0.15),
      rgba(22, 193, 68, 0.15)
    );
    content: '';
    animation: gradient 10s ease infinite;
    background-size: 400% 400%;
    z-index: -1;
  }

  @keyframes gradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
