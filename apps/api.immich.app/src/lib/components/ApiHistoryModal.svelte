<script lang="ts">
  import ApiHistory from '$lib/components/ApiHistory.svelte';
  import type { HistoryItem } from '$lib/services/open-api.d';
  import { Heading, Modal, ModalBody } from '@immich/ui';
  import { mdiHistory } from '@mdi/js/mdi';

  type Props = {
    name: string;
    history: HistoryItem[];
    onClose: () => void;
  };

  const { name, history, onClose }: Props = $props();
</script>

<Modal title="Parameter History" icon={mdiHistory} {onClose}>
  <ModalBody>
    <Heading size="small" class="mb-2">
      <code>{name}</code>
    </Heading>
    <ApiHistory {history} />
  </ModalBody>
</Modal>
