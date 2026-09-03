<script lang="ts">
  import { getProjectUrl, ProjectTag, type Project } from '$lib';
  import { Badge, Card, CardBody, CardHeader, Heading, Link, Text, type Color, type IconLike } from '@immich/ui';
  import { mdiAlertOutline, mdiCheckDecagram, mdiCodeTags, mdiOpenInNew, mdiRobot, mdiWeb } from '@mdi/js/mdi';

  type Props = {
    project: Project;
  };

  const { project }: Props = $props();

  const badges: Record<ProjectTag, { color: Color; icon: IconLike }> = {
    [ProjectTag.Official]: { color: 'primary', icon: mdiCheckDecagram },
    [ProjectTag.Unmaintained]: { color: 'warning', icon: mdiAlertOutline },
    [ProjectTag.VibeCoded]: { color: 'warning', icon: mdiRobot },
  };

  const url = $derived(getProjectUrl(project));
</script>

<Card color="secondary" class="h-full">
  <CardHeader>
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <Link href={url} underline={false}>
        <Heading size="small" class="hover:underline">{project.title}</Heading>
      </Link>

      {#each project.tags as tag (tag)}
        <Badge leadingIcon={badges[tag].icon} size="small" color={badges[tag].color}>{tag}</Badge>
      {/each}
    </div>
    <Link href={url} underline={false}>
      <Text color="muted" size="small" class="hover:underline">{url}</Text>
    </Link>
  </CardHeader>
  <CardBody>
    <Text>{project.description}</Text>
  </CardBody>
  <div class="flex flex-wrap items-center gap-2 px-4 pb-4">
    {#if project.websiteUrl}
      <Link href={project.websiteUrl} underline={false}>
        <Badge leadingIcon={mdiWeb} size="small" color="primary" trailingIcon={mdiOpenInNew}>Website</Badge>
      </Link>
    {/if}
    {#if project.sourceCodeUrl}
      <Link href={project.sourceCodeUrl} underline={false}>
        <Badge leadingIcon={mdiCodeTags} size="small" color="primary" trailingIcon={mdiOpenInNew}>Source code</Badge>
      </Link>
    {/if}
  </div>
</Card>
