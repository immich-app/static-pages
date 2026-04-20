import { onMount, setContext } from 'svelte';
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

  /**
   * Time (Date.now()) at which each question first became visible in the
   * current session. Used to compute `answerMs` per question for analytics.
   * Plain non-reactive object — it's written from a $effect that reads the
   * reactive `engine.currentQuestion.id` and stamps a timestamp on change.
   * Reset on page reload (resume after refresh starts the timer from 0).
   */
  const questionShownAt: Record<string, number> = {};

  /**
   * Pre-flush hooks for debounced question components. When beforeunload
   * fires, we call every hook BEFORE flushBufferSync so that any pending
   * 300ms debounce timer in the active text/email/number/textarea component
   * fires and gets its latest value into the buffer before the beacon sends
   * it. Multiple hooks can be registered simultaneously (e.g. during the
   * brief overlap between one component's onDestroy and the next's onMount)
   * — each unregister removes only the hook it registered.
   */
  const preFlushHooks = new Set<() => void>();

  function registerPreFlush(hook: () => void) {
    preFlushHooks.add(hook);
  }

  function unregisterPreFlush(hook: () => void) {
    preFlushHooks.delete(hook);
  }

  // Expose the pre-flush registry via Svelte context so debounced question
  // components can register without prop drilling through SurveyShell/QuestionCard.
  setContext('survey-pre-flush', { registerPreFlush, unregisterPreFlush });

  $effect(() => {
    const q = engine?.currentQuestion;
    if (q && questionShownAt[q.id] === undefined) {
      questionShownAt[q.id] = Date.now();
    }
  });

  async function loadAndInit() {
    // Load survey definition
    const data = await getPublishedSurvey(slug);
    survey = data.survey;
    sections = data.sections;
    questions = data.questions;

    // Check if password protected (backend returns no questions/sections)
    if (survey.requiresPassword && questions.length === 0) {
      needsPassword = true;
      return;
    }

    // Connect WebSocket first — the DO's upgrade handler creates the respondent,
    // sets the cookie, and tags the connection with the respondent ID. No HTTP
    // resume round-trip needed.
    wsClient = createSurveyWsClient(slug, 'respondent');

    await initializeSurvey();
  }

  onMount(() => {
    (async () => {
      try {
        await loadAndInit();
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load survey';
      }
      loading = false;
    })();

    const handleUnload = () => {
      for (const hook of preFlushHooks) hook();
      client?.flushBufferSync();
    };
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

    // Create engine and client; give the client the WS connection
    engine = createSurveyEngine(questions);
    client = createApiClient(slug);
    client.onSaveError((msg) => {
      error = msg;
    });
    client.onSaveSuccess(() => {
      // Clear any lingering save-failure toast once a flush succeeds.
      if (error) error = null;
    });
    if (wsClient) client.setWsClient(wsClient);

    // Resume via WS (HTTP fallback handled by client)
    const resume = await client.fetchResume();
    if (resume.isComplete) {
      alreadyCompleted = true;
    } else if (resume.answers && resume.nextQuestionIndex !== undefined && resume.nextQuestionIndex > 0) {
      // Cap the resume index to the last valid question. If the respondent
      // answered every question but never hit Submit (tab crash, browser
      // close), nextQuestionIndex can be past the end of the array. We
      // land them on the LAST question so they can review their answer and
      // click Submit — auto-completing would skip any unsaved free-text
      // edits they were working on.
      const safeIndex = Math.min(resume.nextQuestionIndex, questions.length - 1);
      engine.initialize(resume.answers, safeIndex);
    } else {
      showWelcome = true;
    }
  }

  function start() {
    showWelcome = false;
  }

  function handleAnswer(questionId: string, value: string, otherText?: string) {
    engine?.setAnswer(questionId, value, otherText);
    const shownAt = questionShownAt[questionId];
    const answerMs = shownAt !== undefined ? Date.now() - shownAt : undefined;
    client?.bufferAnswer({ questionId, value, otherText, answerMs });
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
      await loadAndInit();
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
