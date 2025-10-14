<script lang="ts">
  import { cleanClass } from '$lib';
  import ApiSchemaType from '$lib/components/ApiSchemaType.svelte';
  import { getOpenApi, getRefHref, isRef } from '$lib/services/open-api';
  import type { ReferenceObject, SchemaObject } from '$lib/services/open-api.d';
  import { Link, Text } from '@immich/ui';

  type Props = {
    schema: SchemaObject | ReferenceObject;
    array?: boolean;
  };

  const { schema: schemaOrRef, array = false }: Props = $props();
  const suffix = $derived(array ? '[]' : '');

  const { fromRef } = getOpenApi();

  const badgeClasses = 'py-1 px-2 rounded-lg text-sm';
  const Colors = {
    Pink: 'dark:bg-pink-900 dark:text-pink-50 bg-pink-200',
    Green: 'dark:bg-green-900 dark:text-green-50 bg-green-200',
    Gray: 'dark:bg-neutral-600 dark:text-dark bg-gray-200',
    Purple: 'dark:bg-purple-900 dark:text-purple-50 bg-purple-200',
    Blue: 'dark:bg-blue-900 dark:text-blue-50 bg-blue-200',
    Yellow: 'dark:bg-yellow-700 dark:text-yellow-50 bg-yellow-200',
    Fuchsia: 'dark:bg-fuchsia-900 dark:text-fuchsia-50 bg-fuchsia-300',
  };

  const getBadge = (schema: SchemaObject): { colors: string; value: string } => {
    switch (schema.type) {
      case 'boolean': {
        return { value: 'Boolean', colors: Colors.Green };
      }

      case 'number':
      case 'integer': {
        return { value: 'Number', colors: Colors.Purple };
      }

      case 'string': {
        switch (schema.format) {
          case 'date-time': {
            return { value: 'DateTime', colors: Colors.Blue };
          }

          case 'uuid': {
            return { value: 'UUID', colors: Colors.Fuchsia };
          }

          default: {
            return { value: schema.format ?? `String`, colors: Colors.Yellow };
          }
        }
      }

      default: {
        return {
          value: schema.format ?? `Unknown`,
          colors: 'dark:bg-pink-900 dark:text-pink-50 bg-pink-200',
        };
      }
    }
  };

  const schema = $derived(schemaOrRef as SchemaObject);
</script>

<div class="flex place-items-center gap-1">
  {#if isRef(schema)}
    {@const ref = fromRef(schema)}
    {#if ref}
      <Link href={getRefHref(schema)}>
        <span class={cleanClass(badgeClasses, Colors.Pink)}>{ref.name + suffix}</span>
      </Link>
    {:else}
      <span class={cleanClass(badgeClasses, 'text-muted')}>Ref not found: {schema.$ref}</span>
    {/if}
  {:else if schema.type === 'array' && schema.items}
    <ApiSchemaType array schema={schema.items} />
  {:else if schema.allOf}
    {#each schema.allOf as item, i (i)}
      <div class="flex gap-1">
        {#if i !== 0}
          <Text color="muted">|</Text>
        {/if}
        <ApiSchemaType schema={item} />
      </div>
    {/each}
  {:else}
    {@const badge = getBadge(schemaOrRef as SchemaObject)}
    <span class={cleanClass(badgeClasses, badge.colors)}>{badge.value + suffix}</span>
  {/if}

  {#if schema.nullable}
    <span class="text-dark font-thin">|</span>
    <span class={cleanClass(badgeClasses, Colors.Gray)}>Null</span>
  {/if}
</div>
