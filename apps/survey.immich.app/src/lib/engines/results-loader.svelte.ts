import { onMount, onDestroy } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import type {
  Survey,
  SurveyQuestion,
  SurveySection,
  TimelineDataPoint,
  DropoffDataPoint,
  CompletionTimesPayload,
  QuestionTimingEntry,
  LiveCounts,
} from '../types';
import {
  getSurvey,
  getLiveResults,
  exportResults,
  getSurveyTimeline,
  getSurveyDropoff,
  getSurveyCompletionTimes,
  getSurveyQuestionTimings,
} from '../api/surveys';
import { createSurveyWsClient, registerWsClient, type SurveyWsClient } from '../api/survey-ws';

type Granularity = 'minute' | 'hour' | 'day';

const EMPTY_COMPLETION_TIMES: CompletionTimesPayload = {
  count: 0,
  mean: null,
  median: null,
  p25: null,
  p75: null,
  min: null,
  max: null,
  buckets: [],
};

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
  let completionTimes = $state<CompletionTimesPayload>(EMPTY_COMPLETION_TIMES);
  let questionTimings = $state<QuestionTimingEntry[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let activeTab = $state<'overview' | 'responses' | 'search'>('overview');
  let granularity = $state<Granularity>('day');
  let exporting = $state(false);

  let pollInterval: ReturnType<typeof setInterval> | undefined;
  let wsClient: SurveyWsClient | undefined;

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

  /** Coarsen the bucket size with the timestamp span so the chart isn't drowned in buckets. */
  function pickGranularity(data: TimelineDataPoint[]): Granularity {
    if (data.length <= 1) return 'minute';
    // Server returns minute-granularity periods as "YYYY-MM-DDTHH:MM".
    const first = Date.parse(`${data[0].period}:00Z`);
    const last = Date.parse(`${data[data.length - 1].period}:00Z`);
    const spanMs = last - first;
    const hours = spanMs / (1000 * 60 * 60);
    if (hours <= 2) return 'minute';
    if (hours <= 72) return 'hour';
    return 'day';
  }

  function handleGranularityChange(g: Granularity) {
    granularity = g;
    refreshTimeline();
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

  onMount(() => {
    (async () => {
      try {
        // Fetch at minute granularity so pickGranularity can measure the span.
        const [surveyData, resultsData, initialTimeline, dropoff, ctimes, qtimings] = await Promise.all([
          getSurvey(surveyId),
          getLiveResults(surveyId),
          getSurveyTimeline(surveyId, 'minute'),
          getSurveyDropoff(surveyId),
          getSurveyCompletionTimes(surveyId),
          getSurveyQuestionTimings(surveyId),
        ]);
        survey = surveyData.survey;
        questions = surveyData.questions;
        sections = surveyData.sections;
        if (resultsData) {
          respondentCounts = resultsData.respondentCounts;
          results = resultsData.results;
          liveCounts = resultsData.liveCounts;
        }
        granularity = pickGranularity(initialTimeline);
        if (granularity === 'minute') {
          timelineData = initialTimeline;
        } else {
          timelineData = await getSurveyTimeline(surveyId, granularity);
        }
        dropoffData = dropoff;
        completionTimes = ctimes;
        questionTimings = qtimings;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load results';
      }
      loading = false;

      if (survey?.slug) {
        wsClient = createSurveyWsClient(survey.slug, 'viewer');
        registerWsClient(surveyId, wsClient);

        wsClient.on('counts', (data) => {
          liveCounts = data;
        });

        wsClient.on('stats', (data) => {
          respondentCounts = { total: data.total, completed: data.completed };
        });

        wsClient.on('results', (data) => {
          respondentCounts = data.respondentCounts;
          // Pushes carry only choice-question results — merge rather than
          // replace so text/email/number answers from the initial load survive.
          const updates: Record<string, (typeof data.results)[number]> = {};
          for (const r of data.results) updates[r.questionId] = r;
          results = results.map((r) => updates[r.questionId] ?? r);
        });

        // Slow-tier analytics (once a minute) — the SQL aggregations that can't
        // ride the 5s push. Its timeline is always minute-granular, so ignore
        // that field when the user has chosen a coarser bucket.
        wsClient.on('analytics', (data) => {
          if (granularity === 'minute') {
            timelineData = data.timeline;
          }
          dropoffData = data.dropoff;
          completionTimes = data.completionTimes;
          questionTimings = data.questionTimings;
        });
      }
    })();

    // HTTP polling as fallback (less frequent since WS handles live updates)
    pollInterval = setInterval(() => {
      refreshResults();
    }, 30_000);
  });

  onDestroy(() => {
    clearInterval(pollInterval);
    wsClient?.close();
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
    get completionTimes() {
      return completionTimes;
    },
    get questionTimings() {
      return questionTimings;
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
    get exporting() {
      return exporting;
    },
    getQuestionResult,
    handleGranularityChange,
    handleExport,
  };
}
