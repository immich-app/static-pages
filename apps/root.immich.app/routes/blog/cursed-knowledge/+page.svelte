<script>
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import GithubReference from '$lib/components/GithubReference.svelte';
  import { Button, Code, Constants, Text } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<BlogPage post={Posts.CursedKnowledge}>
  <Text>
    After working on Immich for a year or two, the team, collectively, had learned a lot of <i>weird</i> stuff. We often
    found ourselves discussing these oddities, which we internally dubbed "cursed knowledge" — knowledge we had, that we
    wished we did <i>not</i> have. The range of topics varied from obscure bugs to random, unintuitive library behavior.
    Eventually, we decided to create a dedicated page to document what we had learned.
  </Text>

  <hr />
  <Button href={Constants.Pages.CursedKnowledge} trailingIcon={mdiOpenInNew} color="secondary"
    >View Cursed Knowledge</Button
  >
  <hr />

  <Text>
    The first batch of cursed knowledge was added in <GithubReference number={10907} /> and included behavior of JavaScript
    date objects, bcrypt limitations, weird npm packages, and PostgreSQL NOTIFY behavior. Naturally, this cursed knowledge
    is heavily connected to the tools and technology we use, which mainly consists of Node.js, JavaScript, TypeScript, &
    PostgreSQL. However, Immich itself, as a self-hosted photo & video management product, exposes us to complexities with
    media files, codecs, image processing, authentication, browsers, and varying operating systems, that our users run Immich
    on. All of this to say, that the team has been exposed to <i>a lot</i> of cursed knowledge over the years while building
    it.
  </Text>

  <Text>
    It is worth clarifying that the purpose of this page is not to <i>complain</i>. We, more than most, understand the
    complexities of building software, and the challenges that every developer faces. We rely on, and appreciate the
    work of other developers, especially those that have built the tools that we use today. Instead, the page aims to
    document <i>knowledge we have, that we wish we did not</i>. We do not <i>want</i> to know how cursed JavaScript date
    objects are, but, inevitably, we do. Some entries are just quirks, while other are undefined, or even
    <i>expected</i> behavior. Either way, if it's in the list, we wish we didn't have to know it.
  </Text>

  <Text>
    It is also worth mentioning that some of the cursed knowledge is now "legacy". Some of the issues, like the
    Cloudflare <Code>Fetch</Code> behavior is <i>less cursed</i> because the setting that enabled this behavior now has a
    different default, and it is much more difficult to enable it unknowingly.
  </Text>

  <Text>
    Inevitably, and somewhat reluctantly, we will likely continue to gain <i>even more</i> cursed knowledge. We will continue
    to update our page as this happens, so check back periodically for new entries!
  </Text>
</BlogPage>
