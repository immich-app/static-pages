import { onMount } from 'svelte';
import type { Survey, SurveySection, SurveyQuestion } from '../types';
import { getPublishedSurvey, sendHeartbeat } from '../api/surveys';
import { createApiClient } from '../api/client';
import { createSurveyEngine, randomizeQuestions, randomizeOptionOrder } from './survey-engine.svelte';

export function createSurveyLoader(slug: string) {
  let survey = $state<Survey | null>(null);
  let sections = $state<SurveySection[]>([]);
  let questions = $state<SurveyQuestion[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showWelcome = $state(false);
  let alreadyCompleted = $state(false);
  let surveyFinished = $state(false);

  let engine: ReturnType<typeof createSurveyEngine> | null = $state(null);
  let client: ReturnType<typeof createApiClient> | null = null;

  onMount(() => {
    (async () => {
      try {
        // Load survey definition
        const data = await getPublishedSurvey(slug);
        survey = data.survey;
        sections = data.sections;
        questions = data.questions;

        // Sort questions by section sort order, then question sort order
        const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
        const sortedQuestions: SurveyQuestion[] = [];
        for (const section of sortedSections) {
          const sectionQuestions = questions
            .filter((q) => q.section_id === section.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          sortedQuestions.push(...sectionQuestions);
        }
        questions = sortedQuestions;

        // Apply randomization if enabled
        if (survey.randomizeQuestions) {
          questions = randomizeQuestions(questions, sections, slug);
        }
        if (survey.randomizeOptions) {
          questions = randomizeOptionOrder(questions, slug);
        }

        // Create engine and client
        engine = createSurveyEngine(questions);
        client = createApiClient(slug);

        client.onSaveError((msg) => {
          error = msg;
        });

        // Resume
        const resume = await client.fetchResume();
        if (resume.isComplete) {
          alreadyCompleted = true;
        } else if (resume.answers && resume.nextQuestionIndex !== undefined && resume.nextQuestionIndex > 0) {
          engine.initialize(resume.answers, resume.nextQuestionIndex);
        } else {
          showWelcome = true;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load survey';
      }
      loading = false;
    })();

    // Heartbeat for live viewer tracking
    const heartbeatViewerId = crypto.randomUUID();
    sendHeartbeat(slug, heartbeatViewerId, 'respondent');
    const heartbeatTimer = setInterval(() => sendHeartbeat(slug, heartbeatViewerId, 'respondent'), 15_000);

    const handleUnload = () => client?.flushBufferSync();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('beforeunload', handleUnload);
      client?.destroy();
    };
  });

  function start() {
    showWelcome = false;
  }

  function handleAnswer(questionId: string, value: string, otherText?: string) {
    engine?.setAnswer(questionId, value, otherText);
    client?.bufferAnswer({ questionId, value, otherText });
  }

  async function handleComplete() {
    if (!client) return;
    try {
      const flushed = await client.flushBuffer();
      if (!flushed) {
        error = 'Failed to save your answers. Please try again.';
        return;
      }
      await client.postComplete();
      surveyFinished = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to submit survey. Please try again.';
    }
  }

  function dismissError() {
    error = null;
  }

  return {
    get survey() {
      return survey;
    },
    get sections() {
      return sections;
    },
    get questions() {
      return questions;
    },
    get engine() {
      return engine;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    get showWelcome() {
      return showWelcome;
    },
    get alreadyCompleted() {
      return alreadyCompleted;
    },
    get surveyFinished() {
      return surveyFinished;
    },
    start,
    handleAnswer,
    handleComplete,
    dismissError,
  };
}
