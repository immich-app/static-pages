<script lang="ts">
  interface Props {
    text: string;
    description?: string;
    headingId?: string;
    descriptionId?: string;
  }
  let { text, description, headingId, descriptionId }: Props = $props();
</script>

<h2 id={headingId} class="mb-2 text-xl font-bold sm:text-2xl">{text}</h2>
{#if description}
  <p id={descriptionId} class="mb-6 text-base text-gray-500">{description}</p>
{/if}
