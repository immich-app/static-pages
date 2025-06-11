<script lang="ts">
  import { Button, Checkbox, Field, HelperText, Input, Modal, ModalBody, ModalFooter, Stack } from '@immich/ui';
  import { exifUploaderManager } from '../../../apps/datasets.immich.app/routes/projects/exif/exif-uploader-manager.svelte';
  import { Turnstile } from 'svelte-turnstile';
  import { PUBLIC_CF_TURNSTILE_SITE } from '$env/static/public';

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let email = $state('');
  let isUploading = $state(false);
  let isPreparing = $state(true);
  let unableToUpload = $state(false);
  let submitButtonText = $state('Preparing');

  let turnstileToken = $state<string | null>(null);

  let emailValid = $derived(email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  async function onTurnstileCallback(token: string) {
    isPreparing = false;
    submitButtonText = `Upload`;

    turnstileToken = token;
  }

  async function onTurnstileError() {
    unableToUpload = true;
    isPreparing = false;
    submitButtonText = `Unable to upload`;
    console.error('Turnstile error occurred');
  }

  async function handleSubmit() {
    isUploading = true;
    submitButtonText = `Uploading (0/${exifUploaderManager.assets.length})`;

    if (!turnstileToken) {
      console.error('Turnstile token is missing');
      isUploading = false;
      return;
    }

    // Handle the submission logic here
    console.log('Dataset submitted with email:', email);

    // TODO: redirect to thank you page
  }
</script>

<Modal title="Dataset Agreement" size="medium" {onClose}>
  <ModalBody>
    <Stack gap={4}>
      <Field
        label="Creative Commons 0"
        description="I declare that I own full rights to this file and I hereby release it under the CCO license into the public domain."
        required
      >
        <Checkbox />
      </Field>
      <Field
        label="File Modification"
        description="The file is manually copied from card/camera, without using any software like Nikon Transfer, and hasn't been modified in any way."
        required
      >
        <Checkbox />
      </Field>
      <Field label="Contact Email" invalid={!emailValid}>
        <Input placeholder="contact@example.com" bind:value={email} />
        <HelperText>This will be used to contact you if there are any issues or questions about your upload</HelperText>
      </Field>
    </Stack>
    <Turnstile
      siteKey={PUBLIC_CF_TURNSTILE_SITE}
      on:callback={(e) => onTurnstileCallback(e.detail.token)}
      on:error={onTurnstileError}
    />
  </ModalBody>
  <ModalFooter>
    <Button
      onclick={handleSubmit}
      shape="round"
      disabled={unableToUpload || !emailValid}
      loading={isUploading || isPreparing}>{submitButtonText}</Button
    >
  </ModalFooter>
</Modal>
