<script lang="ts">
  import { Button, Field, FormModal, Input, toastManager } from '@immich/ui';

  let isOpen = $state(false);
  let value = $state('World');

  const handleSubmit = async () => {
    // Simulate an async request
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toastManager.show({ title: `Hello ${value}` });
    onClose();
  };

  const onClose = () => (isOpen = false);

  const onReset = () => {
    toastManager.info('Reset');
    value = 'World';
  };
</script>

<Button onclick={() => (isOpen = true)}>Open</Button>

{#if isOpen}
  <FormModal title="Loading Form Modal" onSubmit={handleSubmit} {onClose} {onReset}>
    {#snippet children({ formId })}
      <Field label="Name">
        <Input bind:value />
      </Field>

      <div class="mt-2 flex justify-end">
        <Button type="reset" form={formId}>Reset</Button>
      </div>
    {/snippet}
  </FormModal>
{/if}
