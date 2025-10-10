<script lang="ts">
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import { Button, Constants, Link } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import img from '$lib/assets/blog/merch-website.webp';
</script>

<BlogPage post={Posts.ImmichStore}>

Hello everybody,

We would like to introduce you to Mich, our mascot, as well as our merch store! Immich merch has been highly requested by the community, so now it's here! Grab your swag at <Link href={Constants.Sites.Store} /> and let us know what your favorite design is!

---

<img src={img} class="w-full" alt="Immich merch and Mich" />

---

## Origins of Mich

It is pretty common for new users to be unfamiliar with the meaning or pronunciation of Immich. In fact, a few users once asked the team if the original author's name was Mich, as then Immich could have been pronounced "I'm Mich". While not true, it turned into a fun joke. Internally, we actually have a server named Mich, and so naturally it was an early frontrunner for a mascot name.

---

<Button href={Constants.Sites.Store} color="secondary" trailingIcon={mdiOpenInNew}>View Store</Button>

---

We hope you like the merch and Mich, now, back to building more features!

</BlogPage>
