<script lang="ts">
  import { HStack, Icon, Link, Text } from '@immich/ui';
  import { mdiGithub, mdiWeb } from '@mdi/js';
</script>

<div class="flex flex-col place-content-center bg-dark/10">
  <div class="flex place-items-center place-content-center gap-4">
    <Link href="https://github.com/immich-app/immich" target="_blank" rel="noopener noreferrer">
      <HStack gap={1}>
        <Icon icon={mdiGithub} />
        <Text>GitHub</Text>
      </HStack>
    </Link>

    <Link href="https://immich.app" target="_blank" rel="noopener noreferrer">
      <HStack gap={1}>
        <Icon icon={mdiWeb} />
        <Text>Documentation</Text>
      </HStack>
    </Link>

    <Link href="https://discord.immich.app/" target="_blank" rel="noopener noreferrer">
      <Text>Discord</Text>
    </Link>

    <Link href="https://futo.org/" target="_blank" rel="noopener noreferrer">
      <Text>FUTO</Text>
    </Link>
  </div>
</div>
