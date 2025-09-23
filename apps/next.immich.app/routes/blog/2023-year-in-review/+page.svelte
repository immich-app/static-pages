<script>
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import InlineCode from '$lib/components/InlineCode.svelte';
  import { Heading, Link, Text } from '@immich/ui';
</script>

<BlogPage post={Posts.YearInReview2023}>
  <Text>Hi everyone,</Text>
  <Text>Alex from Immich here.</Text>
  <section class="flex flex-col gap-2">
    <Text
      >We are entering the last few weeks of 2023, and it has been quite a year for Immich. The project has grown so
      much in terms of users, developers, features, maturity, and the community around it. When I started working on
      Immich, it was simply a challenge for myself and an opportunity to learn new technologies, crafting something fun
      and useful for my wife during my free time to satisfy my urge to build and create things. I never thought it would
      become so popular and help so many people. At the end of the day, all we have is memory. I am proud that the team
      and I have created something to make storing and viewing those precious memories easier without restrictions and
      without sacrificing our privacy. As the year closes, here's a recap of everything the project accomplished in
      2023.
    </Text>

    <ul class="list-disc ps-6">
      <li>Public shared links</li>
      <li>Favorites page</li>
      <li>Immich turned 1</li>
      <li>Material Design 3 on the mobile app</li>
      <li>Auto-link LivePhotos server-side</li>
      <li>iOS background backup</li>
      <li>Explore page</li>
      <li>CLIP search</li>
      <li>Search by metadata</li>
      <li>Responsive web app</li>
      <li>Archive page</li>
      <li>Asset descriptions</li>
      <li>10,000 stars on GitHub</li>
      <li>Manage auth devices</li>
      <li>Map view</li>
      <li>Facial recognition, clustering, searching, renaming, and person management</li>
      <li>Partner sharing and unifying timeline between partners' users</li>
      <li>Custom storage label</li>
      <li>XMP sidecar reading</li>
      <li>RAW file formats</li>
      <li>Justified layout on the web</li>
      <li>Memories</li>
      <li>Multi-select via SHIFT</li>
      <li>Android Motion Photos</li>
      <li>360° Photos</li>
      <li>Album description</li>
      <li>Album performance improvements (time buckets)</li>
      <li>Video hardware transcoding</li>
      <li>Slideshow mode on the web</li>
      <li>Configuration file</li>
      <li>External libraries</li>
      <li>Trash page</li>
      <li>Custom theme</li>
      <li>Asset Stacking</li>
      <li>20,000 stars on GitHub</li>
      <li>Shared album activity and comments</li>
      <li>CLI v2</li>
      <li>Down to 5 containers (from 8)</li>
    </ul>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2" size="giant">Fun Statistics</Heading>
    <ul class="list-disc ps-6">
      <li>
        We have gone from the release version <InlineCode>1.41.0</InlineCode> to <InlineCode>1.90.0</InlineCode> at the time
        of writing. On average, we see a release every 7 days.
      </li>
      <li>
        According to GitHub's metrics, the <InlineCode>immich-server</InlineCode> container image has been pulled almost
        <i>4 million</i> times.
      </li>
      <li>
        According to mobile app store metrics, we have 22,000 installations on Android and 6700 installation units on
        iOS (opt-in only).
      </li>
      <li>
        We were guests on two podcasts:
        <ul class="list-decimal ps-6">
          <li><Link href="https://selfhosted.show/110" external>Self-hosted</Link></li>
          <li>
            <Link href="https://www.theverge.com/23938533/self-hosting-local-first-software-vergecast" external
              >The Vergecast</Link
            >
          </li>
        </ul>
      </li>
      <li>Immich is making around $1200/month on average from donations. (Thank you all so much!)</li>
      <li>There are over 4,500 members on the Discord server.</li>
      <li>We have over 22,000 stars on the main GitHub repository, gaining 15,000 stars since January 2023.</li>
    </ul>
  </section>

  <Text>
    Diving into the next year, the team will continue to build on the foundation we have laid out over the past year,
    implementing more advanced features for searching, organizing, and sharing between users. Bugs will continue to be
    squashed and conquered. “Shit Alex wrote'' code will continue to be replaced by beautiful, clean code from Jason,
    Zack, Boet, Daniel, Osorin, Mert, Fynn, Marty, Martin, and Jonathan. The team has my eternal gratitude for creating
    a welcoming environment for new contributors, helping, teaching, and learning from each other. I've realized that
    hardly a day has gone by where the team hasn't been in communication about Immich related topics over the past year.
  </Text>

  <Text
    >My long-term goal is to help hone Immich into a diamond in the FOSS space, where the UI, UX, development
    experiences, documentation, and quality are at a high standard while remaining free for everybody to use.</Text
  >

  <Text>I hope you enjoy Immich and have a happy and peaceful holiday.</Text>
</BlogPage>
