<script lang="ts">
  import { Posts } from '$lib';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import BlogFaqs from '$lib/components/BlogFaqs.svelte';
  import { Button, Code, Constants, Link, Text } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import dangerousSite from '$lib/assets/img/dangerous-site.webp';
  import dangerousSiteAppeal from '$lib/assets/img/dangerous-site-appeal.webp';
</script>

<BlogPage post={Posts.GoogleFlagsImmich}>

Earlier this month all of our `*.immich.cloud` websites were marked as dangerous and users started being shown the dreaded "red-screen-of-death" page.

<img src={dangerousSite} alt="Dangerous site" class='rounded-lg mb-4'>

I had never known or understood how this browser feature worked, but it's now, unfortunately, been added to my list of [Cursed Knowledge](/cursed-knowledge).

## Background

Google offers a service called [Safe Browsing](https://safebrowsing.google.com/), which aims to determine if a site is running malware, unwanted software, or performs some form of social engineering. The service is free, and many browsers, including Chrome & Firefox, directly integrate the service into their products, although it is still a bit unclear how it _actually_ determines if something is "dangerous".

So, what happens if your site is marked as dangerous? Well, since most browsers seem to use this service, your site essentially becomes unavailable for all users, except the few that might realize it's a false positive, click the `Details` button, and then see and click the tiny, underlined "visit this safe site" link. So basically it becomes unavailable for your entire audience with little apparent recourse.

## Being flagged

At some point earlier this month, we realized that a bunch of sites on the `immich.cloud` domain had recently started showing up as "dangerous". At the same time, a few users started complaining about their own Immich deployments being flagged. We also noticed that all our own internal sites had the same warning, including our preview environments. It got old _real fast_ to have to go through the tedious effort to "view this safe site" whenever we wanted to view anything.

## Search Console

After a few days we realized this warning was not going to go away on its own, and that the [Google Search Console](https://search.google.com/search-console/about) was apparently the official way to manage these types of issues. It seems a bit crazy that the only way to make our site available again was to create a Google account, and use the Google Search Console to request a review of the affected site. The service did at least provide a few more details about _what exactly_ was flagged, although it made the whole thing a bit more comical. Per the service:

> Google has detected harmful content on some of your site’s pages. We recommend that you remove it as soon as possible. Until then, browsers such as Google Chrome will display a warning when users visit or download certain files from your site.

and

> These pages attempt to trick users into doing something dangerous, such as installing unwanted software or revealing personal information.

Below these warnings was a list of affected URLs:

```
https://main.preview.internal.immich.cloud/
https://main.preview.internal.immich.cloud/auth/login
https://pr-22838.preview.internal.immich.cloud/
https://pr-22838.preview.internal.immich.cloud/auth/login
...
```

It was super useful to learn that the affected URLs were for our _preview environments_. Maybe the thought was that these Immich environments were imitating our [demo website](https://demo.immich.app/)? The most alarming thing was realizing that a single flagged subdomain would apparently invalidate the _entire domain_.

## Impact

This issue affects all of our preview environments and other internal services such as zitadel, outline, grafana, victoria metrics, etc. This also impacts our production tile server, which is deployed at `tiles.immich.cloud`. Luckily, the requests to the tile server are made via JavaScript, and since those are not user facing they seem to still be working as expected.

## "Fixing" the issue

The Google Search Console has a `Request Review` button, where you can explain how you have resolved the issues. It does warn that:

> Requesting a review of issues that weren't fixed will result in longer review cycles

---

## <img src={dangerousSiteAppeal} alt="Dangerous site appeal" class='rounded-lg my-4'>

---

Since, nothing is _actually_ wrong we decided to respond with the following:

> Immich is a self-hosted application, and the Immich team (https://immich.app/) owns and operates the `immich.cloud` domain and subdomains. The flagged sites are our own deployments of our own products and are not impersonating anything or anyone else.

A day or two later, the resolution was accepted and the domain was clean again! 🎉

## Minimizing the issue

An Immich preview environment can be requested by adding the `preview` label to a pull request on GitHub. When the environment is created, a comment is posted on the pull request with the preview url, which follows the following format:

```
https://pr-<num>.preview.internal.immich.cloud/
```

As soon as we created a new preview environment, the `immich.cloud` domain was _once again_ flagged as a dangerous site. The best we can tell, Google crawls GitHub, sees the new URL, crawls the site, marks it as deceptive, and the whole process begins anew.

Our current plan is to attempt to minimize the impact of this issue by moving the preview environments to their own, dedicated domain &mdash; `immich.build`.

## A wider issue

Google Safe Browsing looks to be have been built without consideration for open-source or self-hosted software. Many popular projects have run into similar issues, such as:

- [Jellyfin](https://github.com/jellyfin/jellyfin-web/issues/4076)
- [YunoHost](https://forum.yunohost.org/t/google-flags-my-sites-as-dangerous-deceptive-site-ahead/20361)
- [n8n](https://community.n8n.io/t/deceptive-site-ahead-urgent/24152)
- [NextCloud](https://www.reddit.com/r/NextCloud/comments/w3x0fs/google_marked_my_nextcloud_app_as_a_dangerous/)
- [other Immich deployments](https://www.reddit.com/r/immich/comments/1ne5jbq/google_has_blocked_my_domain_due_to_immich/)
- etc.

Unfortunately, Google seems to have the ability to arbitrarily flag any domain and make it immediately unaccessible to users. I'm not sure what, if anything, can be done when this happens, except constantly request another review from the all mighty Google.

</BlogPage>
