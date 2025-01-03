<script lang="ts">
  import '$lib/app.css';
  import FullPageLayout from '$lib/components/FullPageLayout.svelte';
  import { getCallbackUrl, ImmichLicense } from '$lib/utils/license';
  import { Button, Heading, Icon, Logo, Stack, SupporterBadge, Text } from '@immich/ui';
  import { mdiAccount, mdiCheckCircleOutline, mdiServer } from '@mdi/js';

  const serverFeatures = ['For the whole server', 'Lifetime purchase', 'Supporter status'];
  const userFeatures = ['For an individual', 'Lifetime purchase', 'Supporter status'];
</script>

<FullPageLayout width="md">
  <Stack gap={4}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary">Purchase Immich</Heading>
    </SupporterBadge>
    <section>
      <div class="flex gap-4 justify-between flex-wrap lg:flex-nowrap">
        <!-- SERVER -->
        <div
          class="flex flex-col gap-4 border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-2xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
        >
          <div class="hidden md:flex flex-col gap-1 text-primary">
            <Icon icon={mdiServer} size="56" />
            <Text fontWeight="bold" size="large">Server</Text>
          </div>

          <Stack gap={0}>
            <Heading size="giant" class="text-6xl">$100</Heading>
            <Text>per server</Text>
          </Stack>

          <Stack gap={8}>
            <Stack gap={1}>
              {#each serverFeatures as feature}
                <div class="grid grid-cols-[36px_auto] items-center">
                  <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
                  <Text>{feature}</Text>
                </div>
              {/each}
            </Stack>
            <Button href={getCallbackUrl(ImmichLicense.Server)} fullWidth size="large">Select</Button>
          </Stack>
        </div>

        <!-- INDIVIDUAL -->
        <div
          class="flex flex-col gap-4 border border-gray-300 dark:border-gray-800 w-full p-4 md:p-8 rounded-2xl bg-gray-100 dark:bg-gray-900 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 transition-all"
        >
          <div class="hidden md:flex flex-col gap-1 text-primary">
            <Icon icon={mdiAccount} size="56" />
            <Text fontWeight="bold" size="large">Individual</Text>
          </div>

          <Stack gap={0}>
            <Heading size="giant" class="text-6xl">$25</Heading>
            <Text>per user</Text>
          </Stack>

          <Stack gap={8}>
            <Stack gap={1}>
              {#each userFeatures as feature}
                <div class="grid grid-cols-[36px_auto] items-center">
                  <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
                  <Text>{feature}</Text>
                </div>
              {/each}
            </Stack>
            <Button href={getCallbackUrl(ImmichLicense.Individual)} fullWidth size="large">Select</Button>
          </Stack>
        </div>
      </div>
    </section>

    <Stack gap={4}>
      <Text>
        Building Immich takes a lot of time and effort, and we have full-time engineers working on it to make it as good
        as we possibly can.
      </Text>
      <Text>
        Our mission is for open-source software and ethical business practices to become a sustainable income source for
        developers and to create a privacy-respecting ecosystem with real alternatives to exploitative cloud services.
      </Text>
      <Text>
        As we’re committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
        rely on users like you to support Immich’s ongoing development.
      </Text>
    </Stack>
  </Stack>
</FullPageLayout>
