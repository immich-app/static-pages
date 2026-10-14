<script lang="ts">
  import LinkableHeading from '$common/components/LinkableHeading.svelte';
  import { badges, categories, ProjectTag, siteMetadata, type Category, type Project } from '#lib';
  import ProjectCard from '#lib/components/ProjectCard.svelte';
  import { Button, Heading, Input, SiteMetadata, TableOfContents, Text, type TableOfContentsItem } from '@immich/ui';
  import { mdiEyeOff, mdiMagnify } from '@mdi/js';
  import { SvelteSet } from 'svelte/reactivity';

  let query = $state('');

  const matchesQuery = (project: Project, query: string) =>
    [project.title, project.description, project.websiteUrl, project.sourceCodeUrl]
      .filter(Boolean)
      .join('|')
      .toLowerCase()
      .includes(query);

  const hiddenTags = new SvelteSet<ProjectTag>();
  const hideableTags = Object.values(ProjectTag).filter((tag) => badges[tag].hideable);
  const isHidden = (project: Project) => project.tags.some((tag) => hiddenTags.has(tag));

  const toggleTag = (tag: ProjectTag) => {
    if (hiddenTags.has(tag)) {
      hiddenTags.delete(tag);
    } else {
      hiddenTags.add(tag);
    }
  };

  const filterProjects = (query: string) => {
    query = query.toLowerCase().trim();
    return categories
      .map((category) => ({
        ...category,
        projects: category.projects.filter((project) => !query || matchesQuery(project, query)),
      }))
      .filter((category) => category.projects.length > 0);
  };

  let matchingCategories = $derived(filterProjects(query));
  let matchingProjects = $derived(matchingCategories.flatMap((category) => category.projects));
  let filteredCategories: Category[] = $derived(
    matchingCategories
      .map((category) => ({ ...category, projects: category.projects.filter((project) => !isHidden(project)) }))
      .filter((category) => category.projects.length > 0),
  );
  let hiddenCount = $derived(matchingProjects.filter((project) => isHidden(project)).length);

  let tocItems = $derived<TableOfContentsItem[]>(
    filteredCategories.map(({ id, name, projects }) => ({ id, text: `${name} (${projects.length})`, level: 2 })),
  );
</script>

{#snippet showAll()}
  <button type="button" class="cursor-pointer underline hover:text-primary" onclick={() => hiddenTags.clear()}>
    Show all
  </button>
{/snippet}

<SiteMetadata site={siteMetadata} />

<Heading size="giant">{siteMetadata.title}</Heading>
<Text size="large" color="muted">{siteMetadata.description}</Text>

<div class="mt-6 flex flex-col gap-6 lg:flex-row-reverse lg:items-start lg:gap-8">
  <aside class="flex flex-col gap-6 lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
    <Input type="search" leadingIcon={mdiMagnify} bind:value={query} placeholder="Search..." class="w-full" />

    <section aria-labelledby="filters-title">
      <Text id="filters-title" color="muted" size="small" fontWeight="semi-bold">Filters</Text>
      <div class="mt-3 flex flex-wrap gap-2 lg:flex-col">
        {#each hideableTags as tag (tag)}
          {@const hidden = hiddenTags.has(tag)}
          <Button
            size="small"
            shape="round"
            color={hidden ? 'secondary' : badges[tag].color}
            variant="outline"
            leadingIcon={hidden ? mdiEyeOff : badges[tag].icon}
            aria-pressed={!hidden}
            onclick={() => toggleTag(tag)}
            class="lg:justify-start {hidden ? 'opacity-60' : ''}"
          >
            {tag} ({matchingProjects.filter((project) => project.tags.includes(tag)).length})
          </Button>
        {/each}
        {#if hiddenCount > 0}
          <Text size="small" color="muted" class="self-center lg:self-start">
            {hiddenCount} hidden ·
            {@render showAll()}
          </Text>
        {/if}
      </div>
    </section>

    <TableOfContents items={tocItems} translations={{ table_of_contents_title: 'Quick links' }} class="block w-full" />
  </aside>

  <div class="min-w-0 grow">
    {#if filteredCategories.length === 0}
      <Text color="muted">
        No projects found.
        {#if hiddenCount > 0}
          {hiddenCount} matching {hiddenCount === 1 ? 'project is' : 'projects are'} hidden by filters.
          {@render showAll()}
        {/if}
      </Text>
    {/if}
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
