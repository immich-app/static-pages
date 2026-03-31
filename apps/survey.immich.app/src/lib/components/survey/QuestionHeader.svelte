<script lang="ts">
  interface Props {
    text: string;
    description?: string;
  }
  let { text, description }: Props = $props();
</script>

<h2 class="mb-2 text-xl font-bold sm:text-2xl">{text}</h2>
{#if description}
  <p class="mb-6 text-base text-gray-500">{description}</p>
{/if}
