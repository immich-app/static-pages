<script lang="ts">
  import { getRedirectUrl } from '$lib/utils/license';

  export let licenseKey: string;
</script>

<div class="flex flex-col gap-2">
  <p class="text-lg font-bold">Your License Key</p>
  <div class="bg-immich-primary/10 text-immich-primary py-4 px-8 rounded-lg">{licenseKey}</div>
  <a href={getRedirectUrl(licenseKey, 'https://my.immich.app')}>
    <button
      class="mt-2 p-4 bg-immich-primary text-white rounded-full dark:text-black dark:bg-immich-dark-primary hover:shadow-xl"
      >Activate your instance</button
    >
  </a>
</div>
