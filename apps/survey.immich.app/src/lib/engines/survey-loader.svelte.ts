import { onMount } from 'svelte';
import type { Survey, SurveySection, SurveyQuestion } from '../types';
import { getPublishedSurvey, authenticateSurvey } from '../api/surveys';
import { createSurveyWsClient, type SurveyWsClient } from '../api/survey-ws';
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
  let needsPassword = $state(false);

  let engine: ReturnType<typeof createSurveyEngine> | null = $state(null);
  let client: ReturnType<typeof createApiClient> | null = null;
  let wsClient: SurveyWsClient | undefined;

  onMount(() => {
    (async () => {
      try {
        // Connect WebSocket for presence + data
        wsClient = createSurveyWsClient(slug, 'respondent');

        // Load survey definition (HTTP for initial load — needed before WS is ready)
        const data = await getPublishedSurvey(slug);
        survey = data.survey;
        sections = data.sections;
        questions = data.questions;

        // Check if password protected (backend returns no questions/sections)
        if (survey.requiresPassword && questions.length === 0) {
          needsPassword = true;
          loading = false;
          return;
        }

        await initializeSurvey();
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load survey';
      }
      loading = false;
    })();

    const handleUnload = () => client?.flushBufferSync();
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      wsClient?.close();
      window.removeEventListener('beforeunload', handleUnload);
      client?.destroy();
    };
  });

  async function initializeSurvey() {
    // Sort questions by section sort order, then question sort order
    const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const sortedQuestions: SurveyQuestion[] = [];
    for (const section of sortedSections) {
      sortedQuestions.push(
        ...questions.filter((q) => q.section_id === section.id).sort((a, b) => a.sortOrder - b.sortOrder),
      );
    }
    questions = sortedQuestions;

    // Apply randomization if enabled
    if (survey!.randomizeQuestions) {
      questions = randomizeQuestions(questions, sections, slug);
    }
    if (survey!.randomizeOptions) {
      questions = randomizeOptionOrder(questions, slug);
    }

    // Create engine and client
    engine = createSurveyEngine(questions);
    client = createApiClient(slug);
    client.onSaveError((msg) => {
      error = msg;
    });

    // Resume (HTTP — sets respondent cookie)
    const resume = await client.fetchResume();
    if (resume.isComplete) {
      alreadyCompleted = true;
    } else if (resume.answers && resume.nextQuestionIndex !== undefined && resume.nextQuestionIndex > 0) {
      engine.initialize(resume.answers, resume.nextQuestionIndex);
    } else {
      showWelcome = true;
    }
  }

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

  async function submitPassword(password: string) {
    await authenticateSurvey(slug, password);
    needsPassword = false;
    loading = true;
    error = null;
    try {
      const data = await getPublishedSurvey(slug);
      survey = data.survey;
      sections = data.sections;
      questions = data.questions;

      await initializeSurvey();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load survey';
    }
    loading = false;
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
    get needsPassword() {
      return needsPassword;
    },
    start,
    submitPassword,
    handleAnswer,
    handleComplete,
    dismissError,
  };
}
