<script lang="ts">
  import { Button, Modal, ModalBody, ModalFooter } from '@immich/ui';

  type Props = { onClose: () => void };

  const { onClose }: Props = $props();
</script>

<Modal title="Upload failed" size="medium" {onClose}>
  <ModalBody>
    <p>There was an error while trying to upload your dataset. Please try again later.</p>
  </ModalBody>
  <ModalFooter>
    <Button onclick={onClose} shape="round">Close</Button>
  </ModalFooter>
</Modal>
