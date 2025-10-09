<script>
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import { Button, Constants } from '@immich/ui';
  import { siGithub } from 'simple-icons';
</script>

<BlogPage post={Posts.ImmichUi}>

Last November (2024), I took on the task of trying to build a standalone Svelte component library, based on the Immich
web application. It was a long, time consuming task, especially since I had no prior experience writing a Svelte
component library, or any component library for that matter. Now, almost a year later, the library is being used
across a variety of projects, and more and more code in the main Immich web application is being migrated to use it.

The library is published to npm under the Immich organization at
[@immich/ui](https://www.npmjs.com/package/@immich/ui). You can view the current set of components and a handful of
examples at https://ui.immich.app/. At time of writing there are over 30 components, with more being
added all the time.

---

<Button href="https://ui.immich.app/" color="secondary">View the project</Button>

---

## Technology

The library is built using [Tailwind CSS](https://tailwindcss.com/) and [Svelte](https://svelte.dev/).

---

<Button href="https://github.com/immich-app/ui" color="secondary" leadingIcon={siGithub}>View on GitHub</Button>

---

## Motivation

There were a few motivating factors behind the decision to create this library:

- **Consistency** — the need for a consistent design across Immich websites was a major factor. Especially as we
  started to publish micro sites, such as:
  - https://my.immich.app/
  - https://get.immich.app/
  - https://buy.immich.app/
- **Decoupling** — a lof of code in the Immich web application was tightly coupled to specific usages. Pulling the
  components into a separate library forced me to assess and design their interfaces in a more general purpose &
  resuable manner.
- **Incremental adoption** — with the components being in a separate library, I am able to incrementally migrate code
  from the main application to the library as components become available and stable. This has made it much more
  manageable to migrate the codebase over time.
- **Standardization** — the components in the new library are able to more easily follow and adhere to common patterns
  and interfaces, like the current `Size`, `Color`, and `Variant` properties.

## Future work

There is still a lot of work to do with regard to the library. There are a few key components missing still, like
a Calendar/Date Picker component, and a few more form fields. Also, there is a pretty big gap when it comes to
tests.

Even though I would say the library is incomplete, it has already been a huge win for the team. We recently launched
<https://datasets.immich.app/>, which was built by an intern using the component library, and it looks great! We also just launched
<https://api.immich.app/>, and it similarly looks great and is consistent with our other sites.

</BlogPage>
