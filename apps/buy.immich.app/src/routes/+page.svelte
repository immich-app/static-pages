<script lang="ts">
  import FullPageLayout from '$common/components/FullPageLayout.svelte';
  import { getCallbackUrl, ImmichLicense } from '$lib';
  import { Button, Heading, Icon, Logo, Stack, SupporterBadge, Text } from '@immich/ui';
  import { mdiAccount, mdiCheckCircleOutline, mdiServer } from '@mdi/js';

  const serverFeatures = ['For the whole server', 'Lifetime purchase', 'Supporter status'];
  const userFeatures = ['For an individual', 'Lifetime purchase', 'Supporter status'];
  const retroDiskFeatures = [
    'Physical DVD with artwork',
    'Bootable Immich Instance',
    'Purchasable with Server or Individual Key',
  ];
</script>

<FullPageLayout size="medium">
  <Stack gap={4}>
    <SupporterBadge effect="always">
      <Logo size="large" variant="icon" />
      <Heading size="large" color="primary" tag="h1">Purchase Immich</Heading>
    </SupporterBadge>
    <section>
      <Stack gap={4}>
        <div
          class="gradiant-bg hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 w-full rounded-2xl border border-gray-300 p-6 dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="">
            <div class="flex w-full place-content-center place-items-center">
              <img
                src="https://imgproxy.fourthwall.com/DuRc1wOto_bXVrM-sqTsf17VxnxBXUFEQ5F_PT6sphQ/w:1920/sm:1/enc/CqJpqXXfIjg43qs5/dYp-7fXLhSxgi23i/vXvGKj_Wr12gyskx/XpH5YYXnecOLkEZD/Df2Y8QRXm5WNGa0M/tTxj3yhuyZNfwLfh/HIAL4muGjJJgH77a/m4-0PI8wYVzKDLfL/aKzTzjksdRXbrDIs/C3FH6IfFkB64QwBV/I4q06GTK8g4kyH_x/R_0WQk6JhX0eicl8/yzswcthmPd9IwLY-/daD-bA"
                alt="Immich Retro Disk"
                class="aspect-square w-full rounded-lg object-cover md:w-1/2"
              />
            </div>

            <div
              class="mt-6 flex flex-1 flex-col gap-4 sm:min-w-0 sm:flex-row sm:place-items-center sm:justify-between"
            >
              <div class="flex flex-col gap-2 sm:min-w-0 sm:flex-1">
                <p class="text-primary retro-font text-4xl">Retro Disk</p>
                <Stack gap={1}>
                  {#each retroDiskFeatures as feature, index (index)}
                    <div class="grid grid-cols-[36px_auto] items-center">
                      <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
                      <Text>{feature}</Text>
                    </div>
                  {/each}
                </Stack>
              </div>

              <div class="flex flex-col sm:flex-shrink-0 sm:items-end sm:justify-start">
                <Heading size="giant" class="text-6xl sm:whitespace-nowrap">$25</Heading>
                <Text class="sm:whitespace-nowrap">+ shipping</Text>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <Button href="https://immich.store/products/immich-retro" fullWidth size="large">Select</Button>
          </div>
        </div>
        <hr />

        <div class="flex flex-wrap justify-between gap-4 lg:flex-nowrap">
          <!-- SERVER -->
          <div
            class="hover:bg-immich-primary/10 dark:hover:bg-immich-primary/20 flex w-full flex-col gap-4 rounded-2xl border border-gray-300 bg-gray-100 p-4 transition-all md:p-8 dark:border-gray-800 dark:bg-gray-900"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-start">
              <div class="w-full flex-shrink-0 sm:w-32 md:w-48 lg:w-full">
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

                <div class="flex flex-col sm:flex-shrink-0 sm:items-end sm:justify-start lg:items-start">
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
              <div class="w-full flex-shrink-0 sm:w-32 md:w-48 lg:w-full">
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

                <div class="flex flex-col sm:flex-shrink-0 sm:items-end sm:justify-start lg:items-start">
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

<style>
  @import url('https://fonts.googleapis.com/css2?family=Jersey+15&display=swap');
  .retro-font {
    font-family: 'Jersey 15', sans-serif;
    font-weight: 400;
    font-style: normal;
  }
  .gradiant-bg {
    position: relative;
    background: linear-gradient(
      to right,
      rgba(198, 221, 247, 0.25) 0%,
      rgba(255, 240, 204, 0.25) 25%,
      rgba(152, 191, 163, 0.25) 50%,
      rgba(198, 221, 247, 0.25) 75%,
      rgba(237, 190, 214, 0.25) 100%
    );
  }

  :global(.dark) .gradiant-bg {
    background: linear-gradient(
      to right,
      rgba(198, 221, 247, 0.11) 0%,
      rgba(255, 240, 204, 0.11) 25%,
      rgba(152, 191, 163, 0.11) 50%,
      rgba(198, 221, 247, 0.11) 75%,
      rgba(237, 190, 214, 0.11) 100%
    );
  }

  :global(.dark) .gradiant-bg::before {
    background: rgba(0, 0, 0, 0);
  }

  .gradiant-bg > * {
    position: relative;
    z-index: 1;
  }
</style>
