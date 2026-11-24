<script lang="ts">
  import Modal from '#lib/components/Modal/Modal.svelte';
  import ModalBody from '#lib/components/Modal/ModalBody.svelte';

  type Props = {
    title: string;
    onClose: () => void;
  };

  let { title, onClose }: Props = $props();
</script>

<Modal {title} {onClose}>
  <ModalBody>
    <textarea aria-label="{title} note"></textarea>
  </ModalBody>
</Modal>
