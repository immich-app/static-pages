<script lang="ts">
  import { page } from '$app/state';
  import { createSurveyLoader } from '$lib/engines/survey-loader.svelte';
  import SurveyRouter from '$lib/components/survey/SurveyRouter.svelte';

  const slug = $derived(page.params.slug!);
  const loader = createSurveyLoader(slug);
</script>

<svelte:head>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</svelte:head>

<SurveyRouter {slug} {loader} embedded showReloadOnError={false} />
