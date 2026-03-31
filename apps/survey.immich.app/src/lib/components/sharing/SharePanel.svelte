<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiTwitter, mdiLinkedin, mdiEmail, mdiContentCopy, mdiCheck } from '@mdi/js';

  interface Props {
    url: string;
    title: string;
    description?: string;
  }

  let { url, title, description = '' }: Props = $props();
  let copied = $state(false);

  const twitterUrl = $derived(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  );
  const linkedinUrl = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  );
  const emailUrl = $derived(
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent((description ? description + '\n\n' : '') + url)}`,
  );

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="flex items-center gap-1.5">
  <span class="text-xs font-medium text-gray-500">Share:</span>
  <a
    href={twitterUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
    title="Share on X / Twitter"
  >
    <Icon icon={mdiTwitter} size="16" />
  </a>
  <a
    href={linkedinUrl}
    target="_blank"
    rel="noopener noreferrer"
    class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
    title="Share on LinkedIn"
  >
    <Icon icon={mdiLinkedin} size="16" />
  </a>
  <a
    href={emailUrl}
    class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
    title="Share via email"
  >
    <Icon icon={mdiEmail} size="16" />
  </a>
  <button
    class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
    onclick={copyLink}
    title="Copy link"
  >
    <Icon icon={copied ? mdiCheck : mdiContentCopy} size="16" />
  </button>
</div>
