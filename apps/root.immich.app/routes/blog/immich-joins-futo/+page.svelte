<script lang="ts">
  import { Posts } from '$lib/blog';
  import BlogFaqs from '$lib/components/BlogFaqs.svelte';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import List from '$lib/components/List.svelte';
  import { Heading, Link, Stack, Text } from '@immich/ui';
</script>

<BlogPage post={Posts.ImmichJoinsFuto}>
  <Stack gap={4} class="text-lg">
    <Text fontWeight="bold">Immich is joining <Link href="https://futo.org/">FUTO</Link>!</Text>

    <Text
      >Since the beginning of this adventure, my goal has always been to create a better world for my children. Memories
      are priceless, and privacy should not be a luxury. However, building quality open source has its challenges. Over
      the past two years, it has taken significant dedication, time, and effort.</Text
    >

    <Text
      >Recently, a company in Austin, Texas, called FUTO contacted the team. FUTO strives to develop quality and
      sustainable open software. They build software alternatives that focus on giving control to users. From their
      mission statement:</Text
    >

    <Text>“Computers should belong to you, the people. We develop and fund technology to give them back.”</Text>

    <section class="flex flex-col gap-2">
      <Text
        >FUTO loved Immich and wanted to see if we'd consider working with them to take the project to the next level.
        In short, FUTO offered to:</Text
      >
      <List>
        <li>Pay the core team to work on Immich full-time</li>
        <li>Let us keep full autonomy about the project's direction and leadership</li>
        <li>Continue to license Immich under AGPL</li>
        <li>Keep Immich's development direction with no paywalled features</li>
        <li>Keep Immich “built for the people” (no ads, data mining/selling, or alternative motives)</li>
        <li>Provide us with financial, technical, legal, and administrative support</li>
      </List>
    </section>

    <Text
      >After careful deliberation, the team decided that FUTO's vision closely aligns with our own: to build a better
      future by providing a polished, performant, and privacy-preserving open-source software solution for photo and
      video management delivered in a sustainable way.</Text
    >

    <Text
      >Immich's future has never looked brighter, and we look forward to realizing our vision for Immich as part of
      FUTO.</Text
    >

    <Text>
      If you have more questions, we'll host a Q&A live stream on May 9th at 3PM UTC (10AM CST). <Link
        href="https://www.live-ask.com/event/01HWP2SB99A1K8EXFBDKZ5Z9CF">You can ask questions here</Link
      >, and the stream will be live <Link href="https://youtube.com/live/cwz2iZwYpgg">here on our YouTube channel</Link
      >.
    </Text>
  </Stack>
</BlogPage>

<BlogFaqs>
  <section class="flex flex-col gap-2">
    <Heading tag="h3">What is FUTO?</Heading>
    <Link href="https://futo.org/what-is-futo/">https://futo.org/what-is-futo/</Link>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Will the license change?</Heading>
    <Text>No. Immich will continue to be licensed under AGPL without a CLA.</Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Will Immich continue to be free?</Heading>
    <Text>Yes. The Immich source code will remain freely available under the AGPL license.</Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">Is Immich getting VC funding?</Heading>
    <Text>
      No. Venture capital implies investment in a business, often with the expectation of a future payout (exit plan).
      Immich is neither a business that can be acquired nor comes with a money-making exit plan.
    </Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3"
      >I am currently supporting Immich through GitHub sponsors. What will happen to my donation?</Heading
    >
    <Text>
      Effective immediately, all donations to the Immich organization will be canceled. In the future, we will offer an
      optional, modest payment option instead. Thank you to everyone who donated to help us get this far!
    </Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">How is funding sustainable?</Heading>
    <Text>
      Immich and FUTO believe a sustainable future requires a model that does not rely on users-as-a-product. To this
      end, FUTO advocates that users pay for good, open software. In keeping with this model, we will adopt a purchase
      price. This means we no longer accept donations, but — <em>without limiting features for those who do not pay</em>
      — we will soon allow you to purchase Immich through a modest payment. We encourage you to pay for the high-quality
      software you use to foster a healthy software culture where developers build great applications without hidden motives
      for their users.
    </Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">When does this change take effect?</Heading>
    <Text>This change takes effect immediately.</Text>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h3">What will change?</Heading>
    <Text>The following things will change as Immich joins FUTO:</Text>
    <List>
      <li>The brand, logo, and other Immich trademarks will be transferred to FUTO.</li>
      <li>We will stop all donations to the project.</li>
      <li>The core team can now dedicate our full attention to Immich</li>
      <li>
        Before the end of the year, we plan to have a roadmap for what it will take to get Immich to a stable release.
      </li>
      <li>Bugs will be squashed, and features will be delivered faster.</li>
    </List>
  </section>
</BlogFaqs>
