<script lang="ts">
  import { FormatBytes, Stack } from '@immich/ui';
</script>

<Stack>
  <FormatBytes bytes={50} />
  <FormatBytes bytes={500} />
  <FormatBytes bytes={5000} />
  <FormatBytes bytes={50_000} />
  <FormatBytes bytes={500_000} />
  <FormatBytes bytes={5_000_000} />
</Stack>
