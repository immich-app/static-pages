<script lang="ts">
  import { siteMetadata } from '$lib';
  import List from '$lib/components/List.svelte';
  import { Card, CardBody, Constants, Container, Heading, Link, SiteMetadata, Stack, Text } from '@immich/ui';

  const pageMetadata = {
    title: 'Privacy Policy',
    description:
      'Welcome to Immich. We are committed to respecting your privacy. This Privacy Policy sets out how we collect, use, and share information when you use our Immich app.',
  };
</script>

<SiteMetadata site={siteMetadata} page={pageMetadata} />

<Container size="medium" center>
  <section class="flex flex-col gap-2">
    <Heading tag="h1" size="title">{pageMetadata.title}</Heading>
    <Text color="muted">Last updated: July 31st 2024</Text>
    <Text>{pageMetadata.description}</Text>
  </section>

  <Card color="secondary" class="mt-8">
    <CardBody>
      <Stack gap={6}>
        <section class="flex flex-col gap-2">
          <Heading tag="h2">1. Scope of This Policy</Heading>
          <Text>
            This Privacy Policy applies to the Immich app ("we", "our", or "us") and covers our collection, use, and
            disclosure of your information. This Policy does not cover any third-party websites, services, or
            applications that can be accessed through our app, or third-party services you may access through Immich.
          </Text>
        </section>

        <section class="flex flex-col gap-2">
          <Heading tag="h2">2. Information We Collect</Heading>
          <Text>
            <strong>Locally Stored Data</strong>: Immich stores all your photos, albums, settings, and locally on your
            device. We do not have access to this data, nor do we transmit or store it on any of our servers.
          </Text>
          <Text>
            <strong>Purchase Information:</strong> When you make a purchase within the <Link
              href={Constants.Sites.Buy}
            />, we collect the following information for tax calculation purposes:
          </Text>
          <List>
            <li>Country of origin</li>
            <li>Postal code (if the user is from Canada or the United States)</li>
          </List>
        </section>

        <section class="flex flex-col gap-2">
          <Heading tag="h2">3. Use of Your Information</Heading>
          <Text>
            <strong>Tax Calculation:</strong> The country of origin and postal code (for users from Canada or the United
            States) are collected solely for determining the applicable tax rates on your purchase.
          </Text>
        </section>

        <section class="flex flex-col gap-2">
          <Heading tag="h2">4. Sharing of Your Information</Heading>
          <List>
            <li>
              <strong>Tax Authorities:</strong> The purchase information may be shared with tax authorities as required by
              law.
            </li>
            <li>
              <strong>Payment Providers:</strong> The purchase information may be shared with payment providers where required.
            </li>
          </List>
        </section>

        <section class="flex flex-col gap-2">
          <Heading tag="h2">5. Changes to This Policy</Heading>
          <Text>
            We may update our Privacy Policy from time to time. If we make any changes, we will notify you by revising
            the "Last updated" date at the top of this policy. It's encouraged that users frequently check this page for
            any changes to stay informed about how we are helping to protect the personal information we collect.
          </Text>
        </section>

        <section class="flex flex-col gap-2">
          <Heading tag="h2">6. Contact Us</Heading>
          <Text>
            If you have any questions about this Privacy Policy, please contact us at <Link
              href="mailto:immich@futo.org"
              class="underline">immich@futo.org</Link
            >
          </Text>
        </section>
      </Stack>
    </CardBody>
  </Card>
</Container>
