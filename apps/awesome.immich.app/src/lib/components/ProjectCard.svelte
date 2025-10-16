<script lang="ts">
  import type { Project } from '$lib';
  import { Card, CardBody, CardHeader, Heading, Link, Text } from '@immich/ui';

  type Props = {
    project: Project;
  };

  const { project }: Props = $props();
</script>

<Link href={project.href} underline={false}>
  <Card color="secondary" class="group h-full">
    <CardHeader>
      <Heading size="small" class="group-hover:underline">{project.title}</Heading>
      <Text color="muted" size="small">{project.href}</Text>
    </CardHeader>
    <CardBody>
      <Text>{project.description}</Text>
    </CardBody>
  </Card>
</Link>
