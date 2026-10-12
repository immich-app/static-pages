<script lang="ts">
  import LinkableHeading from '$common/components/LinkableHeading.svelte';
  import { categories, siteMetadata, type Category, type Project } from '#lib';
  import ProjectCard from '#lib/components/ProjectCard.svelte';
  import { Heading, Input, SiteMetadata, TableOfContents, Text, type TableOfContentsItem } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';

  let query = $state('');

  const matchesQuery = (project: Project, query: string) =>
    [project.title, project.description, project.websiteUrl, project.sourceCodeUrl]
      .filter(Boolean)
      .join('|')
      .toLowerCase()
      .includes(query);

  const filterProjects = (query: string) => {
    query = query.toLowerCase().trim();

    const results: Category[] = [];
    for (const category of categories) {
      const projects = category.projects.filter((project) => !query || matchesQuery(project, query));

      if (projects.length > 0) {
        results.push({ ...category, projects });
      }
    }

    return results;
  };

  let filteredCategories = $derived(filterProjects(query));

  let tocItems = $derived<TableOfContentsItem[]>(
    filteredCategories.map(({ id, name, projects }) => ({ id, text: `${name} (${projects.length})`, level: 2 })),
  );
</script>

<SiteMetadata site={siteMetadata} />

<Heading size="giant">{siteMetadata.title}</Heading>
<Text size="large" color="muted">{siteMetadata.description}</Text>

<div class="mt-6 flex flex-col gap-6 lg:flex-row-reverse lg:items-start lg:gap-8">
  <aside class="flex flex-col gap-6 lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
    <Input type="search" leadingIcon={mdiMagnify} bind:value={query} placeholder="Search..." class="w-full" />

    <TableOfContents items={tocItems} translations={{ table_of_contents_title: 'Quick links' }} class="block w-full" />
  </aside>

  <div class="min-w-0 grow">
    {#each filteredCategories as category, i (category.name)}
      {#if i !== 0}
        <hr class="mt-8" />
      {/if}

      <LinkableHeading tag="h2" class="mt-6 mb-2 first:mt-0" id={category.id}>
        {category.name} ({category.projects.length})
      </LinkableHeading>

      <div class="mt-4 grid grid-cols-1 gap-4">
        {#each category.projects as project (category.id + project.title)}
          <ProjectCard {project} />
        {/each}
      </div>
    {/each}
  </div>
</div>
