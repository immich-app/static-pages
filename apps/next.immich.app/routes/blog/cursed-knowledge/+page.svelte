<script>
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import GithubReference from '$lib/components/GithubReference.svelte';
  import { Button, Constants, Text } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<BlogPage post={Posts.CursedKnowledge}>
  <Text
    >After working on Immich for a year or two, the team, collectively, had learned a lot of <i>weird</i> stuff. We
    often found ourselves discussing these oddities, which we internally dubbed "cursed knowledge" — knowledge we had,
    that we wished we did <i>not</i> have. The range of topics varied from obscure bugs to random, unintuitive library behavior.
    Eventually, we decided to create a dedicated page to document what we had learned.
  </Text>

  <hr />
  <Button href={Constants.Pages.CursedKnowledge} external trailingIcon={mdiOpenInNew} color="secondary"
    >View Cursed Knowledge</Button
  >
  <hr />

  <Text
    >The first batch of cursed knowledge was added in <GithubReference number={10907} /> and included behavior of JavaScript
    date objects, bcrypt limitations, weird npm packages, and PostgreSQL NOTIFY behavior. Naturally, this cursed knowledge
    is heavily connected to the tools and technology we use, which mainly consists of Node.js, JavaScript, TypeScript, &
    PostgreSQL. However, Immich itself, as a self-hosted photo & video management product, exposes us to complexities with
    media files, codecs, image processing, authentication, browsers, and varying operating systems, that our users run Immich
    on.
  </Text>

  <Text
    >Since then, we have continued, somewhat reluctantly, to gain even more cursed knowledge. We continue to update our
    page, so check back periodically for new entries!
  </Text>
</BlogPage>
