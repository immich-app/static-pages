<script lang="ts">
  import { getCallbackUrl, ImmichLicense } from '$lib';
  import {
    AppShell,
    AppShellHeader,
    Button,
    Constants,
    Container,
    Heading,
    Icon,
    Link,
    Logo,
    Markdown,
    SiteFooter,
    Stack,
    Text,
  } from '@immich/ui';
  import { mdiAccount, mdiAccountGroup, mdiCheckCircleOutline, mdiOpenInNew } from '@mdi/js';
  import { siGithub } from 'simple-icons';

  type CardProps = {
    title: string;
    icon: string;
    features: string[];
    price: string;
    href: string;
  };
</script>

{#snippet card({ title, icon, features, price, href }: CardProps)}
  <div
    class="flex w-full flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-4 transition-all hover:bg-gray-800 md:p-8"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-start">
      <div class="flex flex-col items-start gap-1 text-primary">
        <Icon {icon} size="56" />
        <Text fontWeight="bold" size="large">{title}</Text>
      </div>

      <Stack gap={1} class="sm:min-w-0 sm:flex-1">
        {#each features as feature, index (index)}
          <div class="grid grid-cols-[36px_auto] items-center">
            <Icon icon={mdiCheckCircleOutline} size="24" class="text-success" />
            <Text>{feature}</Text>
          </div>
        {/each}
      </Stack>

      <div class="flex flex-col sm:shrink-0 sm:items-end sm:justify-start lg:items-start">
        <Heading size="giant" class="text-6xl sm:whitespace-nowrap">{price}</Heading>
      </div>
    </div>

    <Button {href} fullWidth size="large">Select</Button>
  </div>
{/snippet}

<AppShell>
  <AppShellHeader>
    <div class="w-full">
      <nav class="flex justify-between p-2 lg:gap-2">
        <div class="flex place-items-center gap-2">
          <a href="/" class="flex gap-2 text-4xl">
            <Logo variant="inline" />
          </a>
        </div>
        <div class="flex place-items-center justify-end gap-2">
          <Button
            leadingIcon={siGithub.path}
            trailingIcon={mdiOpenInNew}
            href={Constants.Socials.Github}
            color="secondary"
            variant="ghost"
          >
            GitHub
          </Button>
          <Button trailingIcon={mdiOpenInNew} href={Constants.Sites.Docs} color="secondary" variant="ghost">
            Docs
          </Button>
        </div>
      </nav>
    </div>
  </AppShellHeader>

  <Container size="medium" center class="mt-8 mb-24 p-4 lg:p-8">
    <Stack gap={4}>
      <Heading size="giant" tag="h1">Buy Immich</Heading>
      <section>
        <Stack gap={4}>
          <Markdown.Alert variant="tip">
            <div>
              This is a software-only purchase and still requires hardware. See the <Link
                href="https://docs.immich.app/">docs</Link
              > for setup and install instructions.
            </div>
          </Markdown.Alert>

          <Heading size="large">Product keys</Heading>
          <div class="flex flex-wrap justify-between gap-4 lg:flex-nowrap">
            {@render card({
              title: 'Family',
              icon: mdiAccountGroup,
              features: ['For the whole family', 'Lifetime purchase', 'Supporter status'],
              price: '$100',
              href: getCallbackUrl(ImmichLicense.Server),
            })}

            {@render card({
              title: 'Single',
              icon: mdiAccount,
              features: ['For a single user', 'Lifetime purchase', 'Supporter status'],
              price: '$25',
              href: getCallbackUrl(ImmichLicense.Individual),
            })}
          </div>
        </Stack>
      </section>

      <Stack gap={4}>
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
          As we're committed not to add paywalls, this purchase will not grant you any additional features in Immich. We
          rely on users like you to support Immich's ongoing development.
        </Text>
      </Stack>
    </Stack>
  </Container>
  <SiteFooter />
</AppShell>
