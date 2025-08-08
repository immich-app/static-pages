<script lang="ts">
  import { Card, IconButton, theme, Theme } from '@immich/ui';
  import { mdiCheckCircle, mdiContentCopy } from '@mdi/js';
  import { Highlight, LineNumbers } from 'svelte-highlight';
  import type { LanguageType } from 'svelte-highlight/languages';
  import vsLight from 'svelte-highlight/styles/vs';
  import vsDark from 'svelte-highlight/styles/vs2015';

  type Props = {
    code: string;
    language: LanguageType<string>;
    lineNumbers?: boolean;
    lightTheme?: string;
    darkTheme?: string;
  };

  const { code, language, lineNumbers, lightTheme = vsLight, darkTheme = vsDark }: Props = $props();

  let copied = $state(false);
  let canCopy = $derived<boolean>(!!(navigator.clipboard && globalThis.ClipboardItem));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 3000);
    } catch (error) {
      console.error('Failed to copy code to clipboard', error);
    }
  };
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html theme.value === Theme.Dark ? darkTheme : lightTheme}
</svelte:head>

<Card class="relative">
  <div>
    {#if canCopy}
      <span class="absolute top-2 right-2 cursor-pointer">
        <IconButton
          icon={copied ? mdiCheckCircle : mdiContentCopy}
          size="small"
          aria-label={copied ? 'Copied' : 'Copy'}
          variant="ghost"
          color={copied ? 'success' : 'secondary'}
          onclick={handleCopy}
        />
      </span>
    {/if}
    {#if lineNumbers}
      <Highlight {language} {code} let:highlighted>
        <LineNumbers {highlighted} hideBorder wrapLines />
      </Highlight>
    {:else}
      <Highlight {language} {code} />
    {/if}
  </div>
</Card>
