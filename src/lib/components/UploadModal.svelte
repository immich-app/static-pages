<script lang="ts">
  import { PUBLIC_CF_TURNSTILE_SITE, PUBLIC_DATASET_API_ENDPOINT } from '$env/static/public';
  import { Button, Checkbox, Field, HelperText, Input, Modal, ModalBody, ModalFooter, Stack } from '@immich/ui';
  import pLimit from 'p-limit';
  import { Turnstile } from 'svelte-turnstile';
  import type { UploadableAssets } from '../../../apps/datasets.immich.app/types/upload-manager';

  interface Props {
    onClose: (event: { cancelled: boolean; failedIds: string[] }) => void;
    dataset: UploadableAssets;
    datasetName: string;
  }

  let { onClose, dataset, datasetName }: Props = $props();

  let email = $state('');
  let isUploading = $state(false);
  let isPreparing = $state(true);
  let unableToUpload = $state(false);
  let submitButtonText = $state('Preparing');

  let uploadAgreement = $state(false);

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

  async function uploadAsset(
    asset: UploadableAssets['assets'][number],
  ): Promise<{ success: boolean; asset: UploadableAssets['assets'][number] }> {
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
      return { success: false, asset };
    }

    return { success: true, asset };
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
    let failedIds: string[] = [];
    let uploadedCount = 0;

    // 5 concurrent uploads
    const limit = pLimit(5);

    let uploads = dataset.assets.map(async (asset) =>
      limit(async () => {
        const result = await uploadAsset(asset);
        if (result.success) {
          uploadedCount += 1;
          submitButtonText = `Uploading (${uploadedCount}/${dataset.assets.length})`;
        } else {
          failedIds.push(asset.metadata.assetId!);
        }
      }),
    );

    await Promise.all(uploads);

    isUploading = false;
    onClose({ cancelled: false, failedIds });
  }
</script>

<Modal title="Dataset Agreement" size="medium" onClose={() => onClose({ cancelled: true, failedIds: [] })}>
  <ModalBody>
    <Stack gap={4}>
      <span>
        I agree to release the uploaded assets under the
        <a href="https://creativecommons.org/public-domain/cc0/" target="_blank" class="text-primary">CC0 license</a>
        into the public domain. In addition, the files have not been modified in any way that would alter their original
        content or metadata.
      </span>

      <div class="flex gap-4">
        <Checkbox bind:checked={uploadAgreement} />
        <span>I Agree</span>
      </div>

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
      disabled={unableToUpload || !emailValid || !uploadAgreement}
      loading={isUploading || isPreparing}
      class="w-full"
    >
      {submitButtonText}
    </Button>
  </ModalFooter>
</Modal>
