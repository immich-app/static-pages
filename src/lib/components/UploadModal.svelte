<script lang="ts">
  import { Button, Checkbox, Field, HelperText, Input, Modal, ModalBody, ModalFooter, Stack } from '@immich/ui';
  import { Turnstile } from 'svelte-turnstile';
  import { PUBLIC_CF_TURNSTILE_SITE, PUBLIC_DATASET_API_ENDPOINT } from '$env/static/public';
  import type { UploadableAssets } from '../../../apps/datasets.immich.app/types/upload-manager';
  import Page from '../../../apps/datasets.immich.app/routes/+page.svelte';

  interface Props {
    onClose: () => void;
    onFailed: () => void;
    dataset: UploadableAssets;
    datasetName: string;
  }

  let { onClose, onFailed, dataset, datasetName }: Props = $props();

  let email = $state('');
  let isUploading = $state(false);
  let isPreparing = $state(true);
  let unableToUpload = $state(false);
  let submitButtonText = $state('Preparing');

  let uploadFailedDialogShown = $state(false);

  let cc0Agreement = $state(false);
  let fileModificationAgreement = $state(false);

  let authToken = $state<string | null>(null);
  let emailValid = $derived(email !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  async function onTurnstileCallback(token: string) {
    let jwtTokenRequest = await fetch(PUBLIC_DATASET_API_ENDPOINT + '/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ turnstileToken: token }),
    });

    let jwtToken = await jwtTokenRequest.json();

    if (!jwtTokenRequest.ok || !jwtToken.token) {
      onAuthError();
      return;
    }

    authToken = jwtToken.token;

    // success
    isPreparing = false;
    submitButtonText = `Upload`;
  }

  async function onAuthError() {
    unableToUpload = true;
    isPreparing = false;
    submitButtonText = `Unable to upload`;
  }

  function buildUploadBatches(assets: UploadableAssets['assets'], batchSize: number = 5) {
    const batches = [];
    for (let i = 0; i < assets.length; i += batchSize) {
      batches.push(assets.slice(i, i + batchSize));
    }
    return batches;
  }

  async function uploadAsset(asset: UploadableAssets['assets'][number]) {
    const formData = new FormData();
    formData.append('file', asset.data);
    formData.append(
      'data',
      JSON.stringify({
        uploaderEmail: email,
        ...asset.metadata,
      }),
    );

    const response = await fetch(PUBLIC_DATASET_API_ENDPOINT + '/' + datasetName + '/upload', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(`Failed to upload asset ${asset.name}:`, await response.text());
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    isUploading = true;
    submitButtonText = `Uploading (0/${dataset.assets.length})`;

    if (!authToken) {
      console.error('Authentication token is missing');
      isUploading = false;
      return;
    }

    // Handle the submission logic here
    let batches = buildUploadBatches(dataset.assets);
    let uploadedCount = 0;

    for (const batch of batches) {
      let uploadChunk = batch.map(async (asset) => uploadAsset(asset));
      let results = await Promise.all(uploadChunk);
      let successfulUploads = results.filter((result) => result).length;
      uploadedCount += successfulUploads;
      submitButtonText = `Uploading (${uploadedCount}/${dataset.assets.length})`;
    }

    isUploading = false;

    if (uploadedCount != dataset.assets.length) {
      onFailed();
    } else {
      window.location.href = `/thank-you?dataset=${datasetName}`;
    }
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
        <Checkbox bind:checked={cc0Agreement} />
      </Field>
      <Field
        label="File Modification"
        description="The file is manually copied from card/camera, without using any software like Nikon Transfer, and hasn't been modified in any way."
        required
      >
        <Checkbox bind:checked={fileModificationAgreement} />
      </Field>
      <Field label="Contact Email" invalid={!emailValid}>
        <Input placeholder="contact@example.com" bind:value={email} />
        <HelperText>This will be used to contact you if there are any issues or questions about your upload</HelperText>
      </Field>
    </Stack>
    <Turnstile
      siteKey={PUBLIC_CF_TURNSTILE_SITE}
      on:callback={(e) => onTurnstileCallback(e.detail.token)}
      on:error={onAuthError}
    />
  </ModalBody>
  <ModalFooter>
    <Button
      onclick={handleSubmit}
      shape="round"
      disabled={unableToUpload || !emailValid || !cc0Agreement || !fileModificationAgreement}
      loading={isUploading || isPreparing}>{submitButtonText}</Button
    >
  </ModalFooter>
</Modal>
