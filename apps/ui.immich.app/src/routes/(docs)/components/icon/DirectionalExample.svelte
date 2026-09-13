<script lang="ts">
  import { Heading, HStack, Icon, Stack, Text } from '@immich/ui';
  import { mdiArrowRight } from '@mdi/js';

  const icon = mdiArrowRight;
  const size = '2em';
</script>

<HStack gap={8}>
  <Stack>
    <Heading size="tiny">Auto</Heading>
    <div class="flex place-items-center gap-2">
      <Icon {icon} {size} directional />
      <Text>Normal</Text>
    </div>
    <div class="flex place-items-center gap-2">
      <Icon {icon} {size} directional flipped />
      <Text>Flipped</Text>
    </div>
  </Stack>
  <div dir="ltr">
    <Stack>
      <Heading size="tiny">Left-to-right</Heading>
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} directional />
        <Text>Normal</Text>
      </div>
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} directional flipped />
        <Text>Flipped</Text>
      </div>
    </Stack>
  </div>
  <div dir="rtl">
    <Stack>
      <Heading size="tiny">Right-to-left</Heading>
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} directional />
        <Text>Normal</Text>
      </div>
      <div class="flex place-items-center gap-2">
        <Icon {icon} {size} directional flipped />
        <Text>Flipped</Text>
      </div>
    </Stack>
  </div>
</HStack>
