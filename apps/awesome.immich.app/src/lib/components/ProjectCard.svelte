<script lang="ts">
  import type { Project } from '$lib';
  import { Card, CardBody, CardHeader, Heading, Link, Text, Badge } from '@immich/ui';

  type Props = {
    project: Project;
  };

  const { project }: Props = $props();
</script>

<Link href={project.href} underline={false}>
  <Card color="secondary" class="group h-full">
    <CardHeader>
      <div class="flex items-center gap-2">
        <Heading size="small" class="group-hover:underline">{project.title}</Heading>
        {#if project.maintained === false}
          <Badge size="small" color="warning">Unmaintained</Badge>
        {/if}
      </div>
      <Text color="muted" size="small">{project.href}</Text>
    </CardHeader>
    <CardBody>
      <Text>{project.description}</Text>
    </CardBody>
  </Card>
</Link>
