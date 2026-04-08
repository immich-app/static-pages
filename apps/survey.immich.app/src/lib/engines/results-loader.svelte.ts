import { onMount, onDestroy } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { Survey, SurveyQuestion, SurveySection, TimelineDataPoint, DropoffDataPoint, LiveCounts } from '../types';
import { getSurvey, getLiveResults, exportResults, getSurveyTimeline, getSurveyDropoff } from '../api/surveys';
import { connectPresence, type PresenceConnection } from '../api/presence';

export function createResultsLoader(surveyId: string) {
  let survey = $state<Survey | null>(null);
  let questions = $state<SurveyQuestion[]>([]);
  let sections = $state<SurveySection[]>([]);
  let respondentCounts = $state({ total: 0, completed: 0 });
  let results = $state<
    Array<{ questionId: string; answers: Array<{ value: string; otherText: string | null; count: number }> }>
  >([]);
  let liveCounts = $state<LiveCounts>({ activeViewers: 0, activeRespondents: 0 });
  let timelineData = $state<TimelineDataPoint[]>([]);
  let dropoffData = $state<DropoffDataPoint[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'overview' | 'responses' | 'search'>('overview');
  let granularity = $state<'day' | 'hour'>('day');
  let filterQuestionId = $state('');
  let filterValue = $state('');
  let exporting = $state(false);

  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let presenceConn: PresenceConnection | undefined;

  const sortedQuestions = $derived.by(() => {
    const sectionOrder = new SvelteMap(sections.map((s) => [s.id, s.sortOrder]));
    return [...questions].sort((a, b) => {
      const sectionDiff = (sectionOrder.get(a.section_id) ?? 0) - (sectionOrder.get(b.section_id) ?? 0);
      if (sectionDiff !== 0) return sectionDiff;
      return a.sortOrder - b.sortOrder;
    });
  });

  const completionRate = $derived(
    respondentCounts.total > 0 ? Math.round((respondentCounts.completed / respondentCounts.total) * 100) : 0,
  );

  const surveyUrl = $derived(survey?.slug ? `https://survey.immich.app/s/${survey.slug}` : '');

  function getQuestionResult(questionId: string) {
    return results.find((r) => r.questionId === questionId);
  }

  async function refreshResults() {
    try {
      const data = await getLiveResults(surveyId);
      if (data) {
        respondentCounts = data.respondentCounts;
        results = data.results;
      }
    } catch {
      // silently fail on poll
    }
  }

  async function refreshTimeline() {
    try {
      timelineData = await getSurveyTimeline(surveyId, granularity);
    } catch {
      // ignore
    }
  }

  function handleGranularityChange(g: 'day' | 'hour') {
    granularity = g;
    refreshTimeline();
  }

  function handleFilterChange(qId: string, val: string) {
    filterQuestionId = qId;
    filterValue = val;
  }

  async function handleExport(format: 'csv' | 'json') {
    exporting = true;
    try {
      await exportResults(surveyId, format);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Export failed';
    }
    exporting = false;
  }

  onMount(async () => {
    try {
      const [surveyData, resultsData, timeline, dropoff] = await Promise.all([
        getSurvey(surveyId),
        getLiveResults(surveyId),
        getSurveyTimeline(surveyId, granularity),
        getSurveyDropoff(surveyId),
      ]);
      survey = surveyData.survey;
      questions = surveyData.questions;
      sections = surveyData.sections;
      if (resultsData) {
        respondentCounts = resultsData.respondentCounts;
        results = resultsData.results;
        liveCounts = resultsData.liveCounts;
      }
      timelineData = timeline;
      dropoffData = dropoff;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load results';
    }
    loading = false;

    // Start polling for results data (charts, answers)
    pollInterval = setInterval(() => {
      refreshResults();
    }, 15_000);

    // Connect WebSocket for real-time live counts
    if (survey?.slug) {
      presenceConn = connectPresence(survey.slug, 'viewer', (counts) => {
        liveCounts = counts;
      });
    }
  });

  onDestroy(() => {
    clearInterval(pollInterval);
    presenceConn?.close();
  });

  return {
    get survey() {
      return survey;
    },
    get questions() {
      return questions;
    },
    get sortedQuestions() {
      return sortedQuestions;
    },
    get respondentCounts() {
      return respondentCounts;
    },
    get liveCounts() {
      return liveCounts;
    },
    get timelineData() {
      return timelineData;
    },
    get dropoffData() {
      return dropoffData;
    },
    get completionRate() {
      return completionRate;
    },
    get surveyUrl() {
      return surveyUrl;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get activeTab() {
      return activeTab;
    },
    set activeTab(value: 'overview' | 'responses' | 'search') {
      activeTab = value;
    },
    get granularity() {
      return granularity;
    },
    get filterQuestionId() {
      return filterQuestionId;
    },
    get filterValue() {
      return filterValue;
    },
    get exporting() {
      return exporting;
    },
    getQuestionResult,
    handleGranularityChange,
    handleFilterChange,
    handleExport,
  };
}
