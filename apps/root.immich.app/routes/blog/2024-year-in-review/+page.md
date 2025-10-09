<script>
  import emailNotifications from '$lib/assets/blog/email-notifications.webp';
  import folderView from '$lib/assets/blog/folder-view.webp';
  import improvedSearch from '$lib/assets/blog/improved-search.webp';
  import networkSwitching from '$lib/assets/blog/network-switching.webp';
  import newLogo from '$lib/assets/blog/new-logo.webp';
  import { Posts } from '$lib/blog';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import { Button, Constants, Link } from '@immich/ui';
</script>

<BlogPage post={Posts.YearInReview2024}>

Hi everyone,

Alex from Immich here.

On behalf of the team, I'd like to express my heartfelt gratitude for your support in 2024.

Since the first day I posted the [video prototype](https://www.reddit.com/r/selfhosted/comments/si5lp6/i_am_building_a_selfhosted_alternative_version_of/) on the [selfhosted](https://www.reddit.com/r/selfhosted) subreddit, Immich has been on a journey. I still remember the project’s early days and loved seeing those first issues open on GitHub. How exciting it has been to build something useful for so many people. I am grateful for the compassionate community as well as the feedback and criticism we have received this year.

The project's core idea is to do good things without a hidden agenda or ill motives, to give people a delightful choice to manage their digital media besides the solutions from exploitative big cloud providers. Just last year, we were daydreaming of how wonderful it would be if we could do those things daily as our full-time job. One might have said it is good karma, but Louis Rossman from FUTO found us and extended the invitation for the company to fund the project to let us develop the software full-time. It was a dream come true for all the core contributors to talk about Immich, interact with the users, have fun writing code, and build out the features of Immich every day. We would not be here without your love and support for the project.

Similar to <Link href={Posts.YearInReview2023.url}>last year</Link>, here's a recap of everything the project accomplished in 2024.

## Milestones

- A new logo from the community contest <img src={newLogo} alt="New logo from the community contest" class="p-4" />
- GPU acceleration for machine learning
- Library watching
- Search enhancement with advanced filtering <img src={improvedSearch} alt="Better search and filter functionality" class="p-4" />
- Built-in OpenTelemetry metrics
- Read-only albums
- Email notifications <img src={emailNotifications} alt="Email notifications" class="p-4" />
- Microservices container be gone
- Web translation
- Immich-hosted map tiles
- Star rating
- Basic editing on mobile
- Theming on mobile
- Folder view <img src={folderView} alt="Folder view" class="p-4" />
- Tag support
- Album sync on mobile
- Automatic database backup
- Auto-switching server URL in the mobile app <img src={networkSwitching} alt="Network switching on mobile" class="p-4" />
- Alternative machine learning URL switching
- Supporter Badge / <https://buy.immich.app/>
- and more

## Fun Statistics

- Over 30k stars were added to Immich's sky on GitHub ⭐ [editor's note: Jan 16, 23940]
- Going from MIT to AGPLv3 License
- Over 900 awesome people from the community helped make Immich a better software.
- Overcame our first marketing fallout with the choice of wording in the product key purchase introduction
- Immich isn't even 3 years old yet. Technically, we are still an infant.
- Alex got his 150-day comment streak on Reddit.
- As shy as an infant, the project managed to get a lot more screentime from many YouTubers
- Coming down from 12 breaking changes in 2023 to 8 breaking changes released in 2024

## Next Year

- A stable release is our top priority, and we are pushing hard to have it ready by Q1 of 2025.
- After the stable release is out, we have a series of cool features in mind that we want to add to the application, such as (in no particular order)
  - Proper SemVer :P
  - Workflows/Automation
  - Plugin system
  - OCR
  - Pet Detection
  - Federation
  - and more
- We want to offer additional mechanisms and services built directly into Immich to help you with your 3-2-1 backup strategy. This will make self-hosting Immich even easier while allowing you to maintain peace of mind when dealing with your most precious memories.

Finally, the team will attend [FOSDEM 2025](https://fosdem.org/2025) in Brussels, Belgium, on February 1st and 2nd. If you are around, stop by and say “hi.” We will have a stand there on Sunday (02-02), and we also registered for a lightning talk session. We're looking forward to seeing some of you there!

As always, if you find the project helpful, you can support us at <https://buy.immich.app/>

---

<Button href={Constants.Sites.Buy} color="secondary">Purchase Immich</Button>

---

</BlogPage>
