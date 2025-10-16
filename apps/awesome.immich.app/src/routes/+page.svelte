<script lang="ts">
  import LinkableHeading from '$common/components/LinkableHeading.svelte';
  import { categories, siteMetadata, type Category } from '$lib';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import { Heading, Input, Link, SiteMetadata, Text } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';

  let query = $state('');

  const filterProjects = (query: string) => {
    query = query.toLowerCase().trim();

    const results: Category[] = [];
    for (const category of categories) {
      const projects = category.projects.filter(({ title, description, href }) =>
        [title, description, href].join('|').toLowerCase().includes(query),
      );

      if (projects.length > 0) {
        results.push({ ...category, projects });
      }
    }

    return results;
  };

  let filteredCategories = $derived(filterProjects(query));
</script>

<SiteMetadata site={siteMetadata} />

<Heading size="giant">{siteMetadata.title}</Heading>
<Text size="large" color="muted">{siteMetadata.description}</Text>

<Input type="search" leadingIcon={mdiMagnify} bind:value={query} placeholder="Search..." class="my-6 w-full" />

<Heading tag="h2">Quick Links</Heading>
<ul class="mb-8 list-disc ps-6">
  {#each filteredCategories as category (category.name)}
    <li>
      <Link href={`#${category.id}`} class="hover:text-primary" underline={false}>{category.name}</Link>
    </li>
  {/each}
</ul>

{#each filteredCategories as category, i (category.name)}
  {#if i !== 0}
    <hr class="mt-8" />
  {/if}

  <LinkableHeading tag="h2" class="mb-2 mt-6" id={category.id}>
    {category.name} ({category.projects.length})
  </LinkableHeading>

  <div class="mt-4 grid grid-cols-1 gap-4">
    {#each category.projects as project (project.href)}
      <ProjectCard {project} />
    {/each}
  </div>
{/each}
