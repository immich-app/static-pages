<script lang="ts">
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import BlogFaqs from '$lib/components/BlogFaqs.svelte';
  import { Button, Code, Constants, Link, Text } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
  import merchStealth from '$lib/assets/blog/merch-stealth.webp';
  import retroDisk from '$lib/assets/blog/retro-disk.webp';
</script>

<BlogPage post={Posts.StableRelease}>

## Welcome

[Watch the video](https://www.youtube.com/watch?v=xz8LfGXgFAI)

<iframe src="https://www.youtube.com/embed/xz8LfGXgFAI?rel=0" title="Immich Demo DVD" frameBorder="0"   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"  allowFullScreen class="mb-4 aspect-video"></iframe>

Hello everyone,

After:

- _\~1,337 days,_
- _271 releases,_
- _78,000 stars on GitHub,_
- _1,558 contributors,_
- _31,500 members on Discord,_
- _36,000 members on Reddit,_
- _68 languages on Weblate,_
- _Surviving the controversial announcement about joining FUTO,_
- _Having overwhelming success and support from the community with the product keys model,_
- _Launching the Merch store,_
- _Attending our first FOSDEM,_
- _...and **before** the release of GTA VI_

We are thrilled to announce the **stable release of Immich!** 🎉

This has been a journey long in the making. So much has changed since the first commit on the project, all the way back in February, 2022. The project and team continue to grow, and today we're proud to announce `v2.0.0`, our stable release. Stable signifies that we have now resolved a significant amount of technical debt. It also means we will be prioritizing compatibility and less effort will be required to keep Immich up-to-date. Finally, it means that the warning banner on the website has been removed! Along with this, we're happy to announce a new version of the https://immich.app/ website.

For more specifics about the stable release, see our [FAQs](#faqs) below.

## Merch and DVD

To celebrate this release, we want to capture this moment in a nostalgic form, reminiscent of how software was distributed in our childhood - on a CD (or DVD, in this "case"). Introducing Immich Stable in physical form! You can find the link to the disk [here](https://immich.store/products/immich-retro).

<img src={merchStealth} height="1200" width="588" alt="New stealth-themed merch"/>

The disk comes with a fully bootable Immich instance, featuring a selection of curated photos chosen by the team. You can purchase the disk from our merch store, along with a client or server product key, to support and celebrate this milestone with us.

The merch store is also updated with retro-styled Immich designs, check it out in https://immich.store

<img src={retroDisk} height="1200" width="588" alt="New retro demo DVD"/>

## Future plans

Now that Immich is stable, here are some of the things that we will be focusing on:

- **Roadmap** — There are still a few items on our roadmap that we want to complete before the year ends such as auto-stacking, and achieving feature parity between the web and mobile app. We also have plans to start work on improved stack support, better sharing, group management, and ownership improvements, as well as many other enhancements.
- **Usage data** — The team wants to understand how the software is used, so that we can make better, informed decisions as we design and build Immich. We want to collect that information in a non-invasive and transparent way. We plan to discuss it with the community and gather feedback from everyone to come up with the best solution.
- **Backup services** — We aim to introduce additional paid services (_not paywalled features, as we will never implement paywalled features_), which will help support the project and that enhance self-hosting, making it easier and more reliable. First among the many services already planned is an end-to-end encrypted, off-site backup and restore feature, built directly into Immich. This will enable a buddy backup feature as well.

## Thank you

We cannot thank you enough for the support over the past three years. Community participation, from the first comments on the [original reddit post](https://www.reddit.com/r/selfhosted/comments/si5lp6/i_am_building_a_selfhosted_alternative_version_of/), to the feedback when we joined FUTO, have contributed to the awesome product Immich is today. Thank you for joining us and believing in our mission to regain control over your most precious data. Here's to many more years!

~~We'll also be hosting a Q&A livestream tomorrow, **October 2nd, 2025 at 6 PM UTC**. You can submit your questions [here](https://www.live-ask.com/event/01K6GFKQGJSB1GQC086ZJW6F6R) and subscribe for notifications when the livestream starts [here](https://www.youtube.com/live/qgQ4ci2hRMQ).~~

**Update** &mdash; the live stream is over, but you can re-watch it [here](https://www.youtube.com/watch?v=qgQ4ci2hRMQ).

</BlogPage>

<BlogFaqs>

### Will there be a live stream?

~~Yes. We'll be hosting a Q&A livestream tomorrow, **October 2nd, 2025 at 6 PM UTC**. You can submit your questions [here](https://www.live-ask.com/event/01K6GFKQGJSB1GQC086ZJW6F6R) and subscribe for notifications when the livestream starts [here](https://www.youtube.com/live/qgQ4ci2hRMQ).~~

**Update** &mdash; the live stream is over, but you can re-watch it [here](https://www.youtube.com/watch?v=qgQ4ci2hRMQ).

### Do I still need backups?

Yes! A 3-2-1 backup strategy is still crucial. The team has the responsibility to ensure that the application doesn't cause loss of your precious memories; however, we cannot guarantee that hard drives will not fail, or an electrical event causes unexpected shutdown of your server/system, leading to data loss. Therefore, we still encourage users to follow best practices when safeguarding their data. Keep multiple copies of your most precious data: at least two local copies and one copy offsite in cold storage. Additionally, we are starting to work on a cloud backup service, to make backups easier.

### When will `v2.0.0` be available?

~~The docker images for `v2.0.0` will be pushed out a few hours after this post is released.~~

**Update** &mdash; the docker images are available now!

### How can I update to `v2.0.0`?

You can follow the upgrade documentation, [here](https://docs.immich.app/install/upgrading).

### What versioning strategy will Immich use?

Starting with `v2.0.0`, we will now follow [semantic versioning](https://semver.org/).

### What mobile app versions will work with `v2.0.0`?

Any `v2.x.x` version of the mobile app will work with any `2.x.x` version of the server. For example, a mobile app on version `v2.9.0` will continue to work with server versions: `v2.0.0`, `v2.1.0`, `v2.3.1`, etc.

### Will new features continue to be released?

Yes. Immich will continue to build, develop, and release new features.

</BlogFaqs>
