<script lang="ts">
  import { Code, Field, HelperText, IconButton, Stack, TimeInput } from '@immich/ui';
  import { Time } from '@internationalized/date';
  import { mdiClockOutline, mdiClose } from '@mdi/js';
  import type { TimeValue } from 'bits-ui';

  let value1 = $state(new Time(12, 34, 56, 0));
  let value2 = $state<TimeValue>();
  let value3 = $state<TimeValue>();

  const now = () => {
    const date = new Date();
    return new Time(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  };
</script>

<Stack gap={4}>
  <Field label="Time">
    <TimeInput bind:value={value1} />
  </Field>
  <Field label="Leading icon" disabled>
    <TimeInput leadingIcon={mdiClockOutline} />
  </Field>
  <Field label="Leading icon button">
    <TimeInput bind:value={value2}>
      {#snippet leadingIcon()}
        <IconButton
          icon={mdiClockOutline}
          shape="round"
          variant="ghost"
          color="secondary"
          aria-label="Now"
          onclick={() => (value2 = now())}
        />
      {/snippet}
    </TimeInput>
  </Field>
  <Field label="Trailing icon">
    <TimeInput trailingIcon={mdiClockOutline} />
  </Field>
  <Field label="Trailing icon button">
    <TimeInput bind:value={value3}>
      {#snippet trailingIcon()}
        <IconButton
          icon={mdiClose}
          shape="round"
          variant="ghost"
          color="secondary"
          aria-label="Reset"
          onclick={() => (value3 = undefined)}
        />
      {/snippet}
    </TimeInput>
  </Field>
  <Field label="Validation">
    <TimeInput maxValue={new Time(0, 0)} />
    <HelperText class="pt-2">With <Code>maxValue</Code> set to 00:00, all times are invalid.</HelperText>
  </Field>
</Stack>
