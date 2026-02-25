<script lang="ts">
  import FullPageLayout from '$common/components/FullPageLayout.svelte';
  import { getCallbackUrl, ImmichLicense } from '$lib';
  import { Button, Heading, Icon, Logo, Stack, SupporterBadge, Text } from '@immich/ui';
  import { mdiAccount, mdiCheckCircleOutline, mdiServer } from '@mdi/js';

  const serverFeatures = ['For the whole server', 'Lifetime purchase', 'Supporter status'];
  const userFeatures = ['For an individual', 'Lifetime purchase', 'Supporter status'];
</script>

<FullPageLayout size="medium">
  <Stack gap={4}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary" tag="h1">Purchase Immich</Heading>
    </SupporterBadge>
    <section>
      <Stack gap={4}>
        <div class="flex flex-wrap justify-between gap-4 lg:flex-nowrap">
          <!-- SERVER -->
          <div
            class="hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 flex w-full flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-4 transition-all md:p-8 dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-start">
              <div class="w-full shrink-0 sm:w-32 md:w-48 lg:w-full">
                <div class="text-primary flex flex-col items-start gap-1">
                  <Icon icon={mdiServer} size="56" />
                  <Text fontWeight="bold" size="large">Server</Text>
                </div>
              </div>

              <div class="flex flex-1 flex-col gap-4 sm:min-w-0 sm:flex-row sm:justify-between lg:flex-col lg:gap-8">
                <Stack gap={1} class="sm:min-w-0 sm:flex-1">
                  {#each serverFeatures as feature, index (index)}
                    <div class="grid grid-cols-[36px_auto] items-center">
                      <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
                      <Text>{feature}</Text>
                    </div>
                  {/each}
                </Stack>

                <div class="flex flex-col sm:shrink-0 sm:items-end sm:justify-start lg:items-start">
                  <Heading size="giant" class="text-6xl sm:whitespace-nowrap">$100</Heading>
                  <Text class="sm:whitespace-nowrap">per server</Text>
                </div>
              </div>
            </div>

            <Button href={getCallbackUrl(ImmichLicense.Server)} fullWidth size="large">Select</Button>
          </div>

          <!-- INDIVIDUAL -->
          <div
            class="hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 flex w-full flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-4 transition-all md:p-8 dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-start">
              <div class="w-full shrink-0 sm:w-32 md:w-48 lg:w-full">
                <div class="text-primary flex flex-col items-start gap-1">
                  <Icon icon={mdiAccount} size="56" />
                  <Text fontWeight="bold" size="large">Individual</Text>
                </div>
              </div>

              <div class="flex flex-1 flex-col gap-4 sm:min-w-0 sm:flex-row sm:justify-between lg:flex-col lg:gap-8">
                <Stack gap={1} class="sm:min-w-0 sm:flex-1">
                  {#each userFeatures as feature, index (index)}
                    <div class="grid grid-cols-[36px_auto] items-center">
                      <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
                      <Text>{feature}</Text>
                    </div>
                  {/each}
                </Stack>

                <div class="flex flex-col sm:shrink-0 sm:items-end sm:justify-start lg:items-start">
                  <Heading size="giant" class="text-6xl sm:whitespace-nowrap">$25</Heading>
                  <Text class="sm:whitespace-nowrap">per user</Text>
                </div>
              </div>
            </div>

            <Button href={getCallbackUrl(ImmichLicense.Individual)} fullWidth size="large">Select</Button>
          </div>
        </div>
      </Stack>
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
        As we're committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
        rely on users like you to support Immich's ongoing development.
      </Text>
    </Stack>
  </Stack>
</FullPageLayout>
