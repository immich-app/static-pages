<script lang="ts">
  import '$lib/app.css';
  import Button from '$lib/components/button.svelte';
  import Icon from '$lib/components/icon.svelte';
  import { mdiCheckCircleOutline, mdiServer, mdiAccount } from '@mdi/js';
  import { getCallbackUrl, ImmichLicense } from '$lib/utils/license';
</script>

<div class="w-full h-full md:max-w-[900px] px-4 py-10 sm:px-20 lg:p-10 m-auto">
  <div class="m-auto">
    <section
      class="flex flex-col justify-center place-items-center place-content-center border border-gray-300 dark:border-gray-800 rounded-3xl bg-gray-100 dark:bg-gray-900 p-2"
    >
      <img src="/img/immich-logo-inline-light.svg" class="h-24" alt="Immich logo" />
      <p class="md:max-w-[50%] text-center m-2 text-xl">Self-hosted photo and video management solution</p>
    </section>
    <section class="mt-6">
      <div class="flex gap-6 mt-4 justify-between flex-wrap lg:flex-nowrap">
        <!-- SERVER -->
        <div
          class="border border-gray-300 dark:border-gray-800 w-full p-8 rounded-3xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
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

            <a href={getCallbackUrl(ImmichLicense.Server)}>
              <Button fullwidth>Select</Button>
            </a>
          </div>
        </div>

        <!-- INDIVIDUAL -->
        <div
          class="border border-gray-300 dark:border-gray-800 w-full p-8 rounded-3xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20"
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

            <a href={getCallbackUrl(ImmichLicense.Individual)}>
              <Button fullwidth>Select</Button>
            </a>
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
