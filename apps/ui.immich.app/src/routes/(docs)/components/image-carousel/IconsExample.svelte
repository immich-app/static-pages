<script lang="ts">
  import { carouselImageItems } from '$lib/constants.js';
  import { mdiHeart, mdiPlayCircleOutline, mdiStar } from '@mdi/js';
  import { ImageCarousel } from '@immich/ui';

  const items = carouselImageItems.map((item, i) => ({
    ...item,
    leftIcons: i % 2 === 0 ? [mdiStar] : [],
    rightIcons: i % 2 === 0 ? [mdiPlayCircleOutline] : [mdiHeart, mdiPlayCircleOutline],
  }));
</script>

<ImageCarousel {items} />
