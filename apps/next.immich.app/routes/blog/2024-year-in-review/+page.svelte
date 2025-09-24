<script>
  import emailNotifications from '$lib/assets/blog/email-notifications.webp';
  import folderView from '$lib/assets/blog/folder-view.webp';
  import improvedSearch from '$lib/assets/blog/improved-search.webp';
  import networkSwitching from '$lib/assets/blog/network-switching.webp';
  import newLogo from '$lib/assets/blog/new-logo.webp';
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import List from '$lib/components/List.svelte';
  import { Button, Constants, Heading, Link, Text } from '@immich/ui';
</script>

<BlogPage post={Posts.YearInReview2024}>
  <Text>Hi everyone,</Text>

  <Text>Alex from Immich here.</Text>

  <Text>On behalf of the team, I'd like to express my heartfelt gratitude for your support in 2024.</Text>

  <Text
    >Since the first day I posted the <Link
      href="https://www.reddit.com/r/selfhosted/comments/si5lp6/i_am_building_a_selfhosted_alternative_version_of/"
      external>video prototype</Link
    > on the <Link href="https://www.reddit.com/r/selfhosted">selfhosted</Link> subreddit, Immich has been on a journey.
    I still remember the project’s early days and loved seeing those first issues open on GitHub. How exciting it has been
    to build something useful for so many people. I am grateful for the compassionate community as well as the feedback and
    criticism we have received this year.</Text
  >

  <Text
    >The project's core idea is to do good things without a hidden agenda or ill motives, to give people a delightful
    choice to manage their digital media besides the solutions from exploitative big cloud providers. Just last year, we
    were daydreaming of how wonderful it would be if we could do those things daily as our full-time job. One might have
    said it is good karma, but Louis Rossman from FUTO found us and extended the invitation for the company to fund the
    project to let us develop the software full-time. It was a dream come true for all the core contributors to talk
    about Immich, interact with the users, have fun writing code, and build out the features of Immich every day. We
    would not be here without your love and support for the project.</Text
  >

  <Text
    >Similar to <Link href={Posts.YearInReview2023.url}>last year</Link>, here's a recap of everything the project
    accomplished in 2024:</Text
  >
  <section class="flex flex-col gap-2">
    <Heading tag="h2" size="large">Milestones</Heading>

    <List>
      <li>
        <Text>A new logo from the community contest</Text>
        <img src={newLogo} alt="New logo from the community contest" class="p-4" />
      </li>
      <li>GPU acceleration for machine learning</li>
      <li>Library watching</li>
      <li>
        <Text>Search enhancement with advanced filtering</Text>
        <img src={improvedSearch} alt="Better search and filter functionality" class="p-4" />
      </li>
      <li>Built-in OpenTelemetry metrics</li>
      <li>Read-only albums</li>
      <li>
        <Text>Email notifications</Text>
        <img src={emailNotifications} alt="Email notifications" class="p-4" />
      </li>
      <li>Microservices container be gone</li>
      <li>Web translation</li>
      <li>Immich-hosted map tiles</li>
      <li>Star rating</li>
      <li>Basic editing on mobile</li>
      <li>Theming on mobile</li>
      <li>
        <Text>Folder view</Text>
        <img src={folderView} alt="Folder view" class="p-4" />
      </li>
      <li>Tag support</li>
      <li>Album sync on mobile</li>
      <li>Automatic database backup</li>
      <li>
        <Text>Auto-switching server URL in the mobile app</Text>
        <img src={networkSwitching} alt="Network switching on mobile" class="p-4" />
      </li>
      <li>Alternative machine learning URL switching</li>
      <li>Supporter Badge / <Link href="https://buy.immich.app/" external>buy.immich.app</Link></li>
      <li>and more</li>
    </List>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2" size="large">Fun Statistics</Heading>
    <List>
      <li>Over 30k stars were added to Immich's sky on GitHub ⭐ [editor's note: Jan 16, 23940]</li>
      <li>Going from MIT to AGPLv3 License</li>
      <li>Over 900 awesome people from the community helped make Immich a better software.</li>
      <li>Overcame our first marketing fallout with the choice of wording in the product key purchase introduction</li>
      <li>Immich isn't even 3 years old yet. Technically, we are still an infant.</li>
      <li>Alex got his 150-day comment streak on Reddit.</li>
      <li>As shy as an infant, the project managed to get a lot more screentime from many YouTubers</li>
      <li>Coming down from 12 breaking changes in 2023 to 8 breaking changes released in 2024</li>
    </List>
  </section>

  <section class="flex flex-col gap-2">
    <Heading tag="h2" size="large">Next Year</Heading>
    <List>
      <li>A stable release is our top priority, and we are pushing hard to have it ready by Q1 of 2025.</li>
      <li>
        After the stable release is out, we have a series of cool features in mind that we want to add to the
        application, such as (in no particular order)
      </li>
      <List>
        <li>Proper SemVer :P</li>
        <li>Workflows/Automation</li>
        <li>Plugin system</li>
        <li>OCR</li>
        <li>Pet Detection</li>
        <li>Federation</li>
        <li>and more</li>
      </List>
      <li>
        We want to offer additional mechanisms and services built directly into Immich to help you with your 3-2-1
        backup strategy. This will make self-hosting Immich even easier while allowing you to maintain peace of mind
        when dealing with your most precious memories.
      </li>
    </List>
  </section>

  <Text
    >Finally, the team will attend <Link href="https://fosdem.org/2025" external>FOSDEM 2025</Link> in Brussels, Belgium,
    on February 1st and 2nd. If you are around, stop by and say “hi.” We will have a stand there on Sunday (02-02), and we
    also registered for a lightning talk session. We're looking forward to seeing some of you there!</Text
  >

  <Text
    >As always, if you find the project helpful, you can support us at <Link href={Constants.Sites.Buy} external
      >https://buy.immich.app/</Link
    ></Text
  >

  <hr />
  <Button href={Constants.Sites.Buy} external color="secondary">Purchase Immich</Button>
  <hr />

  <section class="flex flex-col gap-2">
    <Text>Have a happy holiday! 🎊</Text>
    <Text>Immich Team</Text>
  </section>
</BlogPage>
