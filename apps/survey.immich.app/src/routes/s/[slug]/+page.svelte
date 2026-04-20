<script lang="ts">
  import { page } from '$app/state';
  import { createSurveyLoader } from '$lib/engines/survey-loader.svelte';
  import SurveyRouter from '$lib/components/survey/SurveyRouter.svelte';

  const slug = $derived(page.params.slug!);
  const loader = createSurveyLoader(slug);
</script>

<SurveyRouter {slug} {loader} />
