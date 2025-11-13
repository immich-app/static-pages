<script lang="ts">
  type Props = {
    value: string;
  };

  const { value }: Props = $props();
</script>

<span
  class="text-dark rounded-lg bg-purple-200 px-2 py-0.5 text-sm dark:bg-purple-900 dark:text-purple-50"
  title="The {value} permission">Permission: {value}</span
>
