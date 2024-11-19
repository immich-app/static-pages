<script lang="ts">
  import '$lib/app.css';
  import Icon from '$lib/components/icon.svelte';
  import { getCallbackUrl, ImmichLicense } from '$lib/utils/license';
  import { Button, Heading, Logo, SupporterBadge, Text, VStack } from '@immich/ui';
  import { mdiAccount, mdiCheckCircleOutline, mdiServer } from '@mdi/js';
</script>

<div class="w-full h-full md:max-w-[900px] p-4 sm:p-8 lg:p-10 m-auto">
  <div class="m-auto">
    <VStack gap={4}>
      <SupporterBadge effect="always">
        <Logo size="large" variant="icon" />
        <Heading size="large" color="primary">Purchase Immich</Heading>
      </SupporterBadge>
      <section>
        <div class="flex gap-6 justify-between flex-wrap lg:flex-nowrap">
          <!-- SERVER -->
          <div
            class="border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-2xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
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
            class="border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-2xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20"
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

      <VStack gap={4}>
        <Text>
          Building Immich takes a lot of time and effort, and we have full-time engineers working on it to make it as
          good as we possibly can.
        </Text>
        <Text>
          Our mission is for open-source software and ethical business practices to become a sustainable income source
          for developers and to create a privacy-respecting ecosystem with real alternatives to exploitative cloud
          services.
        </Text>
        <Text>
          As we’re committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
          rely on users like you to support Immich’s ongoing development.
        </Text>
      </VStack>
    </VStack>
  </div>
</div>
