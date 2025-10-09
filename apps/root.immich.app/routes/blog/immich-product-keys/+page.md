<script lang="ts">
  import { Posts } from '$lib/blog';
  import BlogFaqs from '$lib/components/BlogFaqs.svelte';
  import BlogPage from '$lib/components/BlogPage.svelte';
  import List from '$lib/components/List.svelte';
  import { Button, Code, Constants, Heading, Link, Text } from '@immich/ui';
  import { mdiOpenInNew } from '@mdi/js';
</script>

<BlogPage post={Posts.PurchaseImmich}>
Hello everybody,

Firstly, on behalf of the Immich team, I'd like to thank everybody for your continuous support of Immich since the very first day! Your contributions, encouragement, and community engagement have helped bring Immich to its current state. The team and I are forever grateful for that.

Since <Link href={Posts.ImmichJoinsFuto.url}>joining FUTO</Link>, one of the goals has been to foster a healthy relationship between the developers and the users. We believe that this enables us to create great software, establish transparent policies and build trust.

We want to build a great software application that brings value to you and your loved ones' lives. We are not using you as a product, i.e., selling or tracking your data. We are not putting annoying ads into our software. We respect your privacy. We want to be compensated for the hard work we put in to build Immich for you.

With those notes, we have enabled a way for you to financially support the continued development of Immich, ensuring the software can move forward and will be maintained, by offering a lifetime product key of the software. We think if you like and use software, you should pay for it, but we're never going to force anyone to pay or try to limit Immich for those who don't.

---

<Button href={Constants.Sites.Buy} color="secondary" trailingIcon={mdiOpenInNew}>Purchase Immich</Button>

---

## Product Keys

There are two types of product keys that you can choose to purchase: **Server** or **Individual**.

### Server

This is a lifetime product key, costing $100.00. The product key is applied to <i>the whole server</i>. You and all users that use your server are included.

### Individual

This is a lifetime product key, costing $25.00. The product key is applied to a <i>single user</i>, and can be used on any server they choose to connect to.

## Thank you

Thank you again for your support, this will help create a strong foundation and stability for the Immich team to continue developing and maintaining the project that you love to use.

Starting with release `v1.109.0` you can use your purchased product key to activate Immich.

</BlogPage>

<BlogFaqs>

### 1. Where can I purchase a product key?

There are several places where you can purchase the product key from:

- <https://buy.immich.app>
- <https://pay.futo.org>
- or directly from the app.

### 2. Do I need both **Individual** and **Server** product keys?

No, if you are the admin and the sole user, or your instance has less than a total of 4 users, you can buy the **Individual** product key for each user.

If your instance has more than 4 users, it is more cost-effective to buy the <b>Server</b> product key, which will include all the users on your instance.

### 3. What do I do if I don't pay?

You can continue using Immich without any restriction.

### 4. Will there be any paywalled features?

No, there will never be any paywalled features.

### 5. Where can I get support regarding payment issues?

You can email us at `billing@futo.org` with your `orderId` and your email address. Or, you can reach out to us on our <Link href={Constants.Socials.Discord}>Discord</Link>.

</BlogFaqs>
