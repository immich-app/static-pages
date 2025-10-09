<script lang="ts">
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import { Button, Constants, Link } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<BlogPage post={Posts.ImmichApi}>

Hello everybody,

We would like to announce a new website, <Link href={Constants.Sites.Api}>{Constants.Sites.Api}</Link>. The site
has been built from the ground up to be a central place for all things API related. If you are a 3rd party developer
for an application, integration, tool, or client that integrates with Immich, this is the place for you.

---

<Button href={Constants.Sites.Api} color="secondary" trailingIcon={mdiOpenInNew}>View the new website</Button>

---

The new website has more details about Authentication, Authorization, API key permissions, request and response formats, and a command palette (press `/`) to easily locate endpoints and pages.

If you have any feedback or questions about the new site, feel free to reach out to us on <Link href={Constants.Socials.Discord}>Discord</Link>, <Link href={Constants.Socials.Reddit}>reddit</Link>, or <Link href={Constants.Socials.Github}>GitHub</Link>.

</BlogPage>
