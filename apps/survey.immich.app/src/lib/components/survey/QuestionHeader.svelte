<script lang="ts">
  interface Props {
    text: string;
    description?: string;
    html?: boolean;
  }
  let { text, description, html = false }: Props = $props();
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{text}</h2>
{#if description}
  {#if html}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-6 text-base text-gray-500">{@html description}</p>
  {:else}
    <p class="mb-6 text-base text-gray-500">{description}</p>
  {/if}
{/if}
