<script lang="ts">
  type Props = {
    value: string;
  };

  const { value }: Props = $props();
</script>

<span
  class="py-1 px-2 dark:bg-purple-900 dark:text-purple-50 bg-purple-200 text-dark rounded-lg"
  title="The {value} permission"
>
  <span class="font-mono">{value}</span>
</span>
