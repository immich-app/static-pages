<script lang="ts">
  import DocsDetailPageLayout from '$lib/layouts/DocsDetailPageLayout.svelte';
  import { Heading, Stack, Text } from '@immich/ui';
</script>

<DocsDetailPageLayout>
  <Stack gap={4}>
    <Heading size="giant">Introduction</Heading>
    <img src="/img/social-preview.webp" alt="Social Preview" class="rounded-xl" />
    <Heading size="large">Welcome!</Heading>
    <Text>Hello, I am glad you are here.</Text>
    <Text
      >My name is Alex. I am an Electrical Engineer by schooling, then turned into a Software Engineer by trade and the
      pure love of problem solving.</Text
    >
    <Text
      >We were lying in bed with our newborn, and my wife said, "We are starting to accumulate a lot of photos and
      videos of our baby, and I don't want to pay for App-Which-Must-Not-Be-Named anymore. You always want to build
      something for me, so why don't you build me an app which can do that?"</Text
    >
    <Text
      >That was how the idea started to grow in my head. After that, I began to find existing solutions in the
      self-hosting space with similar backup functionality and the performance level of the App-Which-Must-Not-Be-Named.
      I found that the current solutions mainly focus on the gallery-type application. However, I want a simple-to-use
      backup tool with a native mobile app that can view photos and videos efficiently. So I set sail on this journey as
      a hungry engineer on the hunt.</Text
    >
    <Text
      >Another motivation that pushed me to deliver my execution of the App-Which-Must-Not-Be-Named alternative or
      replacement is for contributing back to the open source community that I have greatly benefited from over the
      years.</Text
    >
    <Text
      >I'm proud to share this creation with you, which values privacy, memories, and the joy of looking back at those
      moments in an easy-to-use and friendly interface.</Text
    >
    <Text
      >If you like the application or it helps you in some way, please consider supporting the project. It will help me
      to continue to develop and maintain the application.</Text
    >
  </Stack>
</DocsDetailPageLayout>
