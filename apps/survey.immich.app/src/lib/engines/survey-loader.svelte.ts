import { onMount, setContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
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
   * When each question first became visible, for the per-question `answerMs`
   * analytics. Deliberately not $state: it is written from the $effect below,
   * which reads reactive state. Resets on reload.
   */
  const questionShownAt: Record<string, number> = {};

  /**
   * Pre-flush hooks for debounced question components, run before
   * flushBufferSync so a pending 300ms debounce lands in the buffer before the
   * beacon sends it. A Set because two components overlap during the
   * onDestroy/onMount handover and each must unregister only its own hook.
   */
  const preFlushHooks = new SvelteSet<() => void>();

  function registerPreFlush(hook: () => void) {
    preFlushHooks.add(hook);
  }

  function unregisterPreFlush(hook: () => void) {
    preFlushHooks.delete(hook);
  }

  /**
   * QuestionCard calls this before validating on Next/Enter so validation sees
   * what was just typed, not the stale pre-debounce (often empty) answer.
   */
  function flushPending() {
    for (const hook of preFlushHooks) hook();
  }

  setContext('survey-pre-flush', { registerPreFlush, unregisterPreFlush, flushPending });

  $effect(() => {
    const q = engine?.currentQuestion;
    if (q && questionShownAt[q.id] === undefined) {
      questionShownAt[q.id] = Date.now();
    }
  });

  async function loadAndInit() {
    const data = await getPublishedSurvey(slug);
    survey = data.survey;
    sections = data.sections;
    questions = data.questions;

    // The backend withholds questions/sections while the password gate is up.
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
    const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const sortedQuestions: SurveyQuestion[] = [];
    for (const section of sortedSections) {
      sortedQuestions.push(
        ...questions.filter((q) => q.section_id === section.id).sort((a, b) => a.sortOrder - b.sortOrder),
      );
    }
    questions = sortedQuestions;

    if (survey!.randomizeQuestions) {
      questions = randomizeQuestions(questions, sections, slug);
    }
    if (survey!.randomizeOptions) {
      questions = randomizeOptionOrder(questions, slug);
    }

    engine = createSurveyEngine(questions);
    client = createApiClient(slug);
    client.onSaveError((msg) => {
      error = msg;
    });
    client.onSaveSuccess(() => {
      if (error) error = null;
    });
    if (wsClient) client.setWsClient(wsClient);

    const resume = await client.fetchResume();
    if (resume.isComplete) {
      alreadyCompleted = true;
    } else if (resume.answers && Object.keys(resume.answers).length > 0) {
      // Resume on the last ANSWERED question, located by id in the client's
      // final (section-grouped, possibly randomized) order: the server's
      // nextQuestionIndex is positional over its own flat sort_order, so
      // applying it here lands on the wrong question. Not auto-advancing also
      // protects a free-text edit that never got flushed before the tab closed.
      const answered = resume.answers;
      let lastAnsweredIdx = -1;
      for (let i = 0; i < questions.length; i++) {
        if (questions[i].id in answered) lastAnsweredIdx = i;
      }
      if (lastAnsweredIdx >= 0) {
        engine.initialize(resume.answers, lastAnsweredIdx);
      } else {
        showWelcome = true;
      }
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
      // Run the debounce hooks before flushing: submit is invoked synchronously
      // from handleNext, before Svelte tears the active component down, so its
      // onDestroy flush hasn't run and a just-typed answer would be lost.
      for (const hook of preFlushHooks) hook();
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
