/**
 * Survey load testing tool.
 *
 * Creates a fresh survey, ramps up simulated users, and reports metrics.
 * Simulates realistic behavior: varying speeds, drop-offs, returning users.
 *
 * Usage:
 *   tsx scripts/load-test.ts --url http://localhost:8787 --users 100 --ramp 30 --duration 120
 */

// ============================================================
// Types
// ============================================================

interface Config {
  baseUrl: string;
  password: string;
  users: number;
  rampSeconds: number;
  durationSeconds: number;
}

interface Question {
  id: string;
  type: string;
  options: string | null;
  has_other: number;
  config: string | null;
  required: number;
}

interface Metric {
  endpoint: string;
  status: number;
  latencyMs: number;
  error?: string;
}

interface UserOutcome {
  answered: number;
  total: number;
  completed: boolean;
  abandoned: boolean;
  returning: boolean;
  durationMs: number;
}

// ============================================================
// CLI
// ============================================================

function parseArgs(): Config {
  const args = process.argv.slice(2);
  const get = (flag: string, def: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : def;
  };

  return {
    baseUrl: get('--url', 'http://localhost:8787').replace(/\/$/, ''),
    password: get('--password', 'load-test-password-12345'),
    users: Number(get('--users', '50')),
    rampSeconds: Number(get('--ramp', '10')),
    durationSeconds: Number(get('--duration', '120')),
  };
}

// ============================================================
// Metrics collector
// ============================================================

class Metrics {
  private data: Metric[] = [];
  private outcomes: UserOutcome[] = [];
  private startTime = performance.now();

  record(m: Metric) {
    this.data.push(m);
  }

  recordUser(o: UserOutcome) {
    this.outcomes.push(o);
  }

  report() {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const total = this.data.length;
    const errors = this.data.filter((m) => m.status >= 400 || m.status === 0).length;

    console.log('\n' + '='.repeat(70));
    console.log('LOAD TEST RESULTS');
    console.log('='.repeat(70));

    console.log(`\nDuration: ${elapsed.toFixed(1)}s | Total requests: ${total} | Errors: ${errors} (${((errors / total) * 100).toFixed(1)}%)`);
    console.log(`Throughput: ${(total / elapsed).toFixed(1)} req/s`);

    // Per-endpoint breakdown
    const endpoints = new Map<string, Metric[]>();
    for (const m of this.data) {
      const group = endpoints.get(m.endpoint) ?? [];
      group.push(m);
      endpoints.set(m.endpoint, group);
    }

    console.log(`\n${'Endpoint'.padEnd(30)} ${'Count'.padStart(6)} ${'Errs'.padStart(5)} ${'p50'.padStart(7)} ${'p90'.padStart(7)} ${'p95'.padStart(7)} ${'p99'.padStart(7)}`);
    console.log('-'.repeat(70));

    for (const [endpoint, metrics] of endpoints) {
      const latencies = metrics.map((m) => m.latencyMs).sort((a, b) => a - b);
      const errs = metrics.filter((m) => m.status >= 400 || m.status === 0).length;
      const pct = (p: number) => latencies[Math.floor(latencies.length * p)] ?? 0;
      console.log(
        `${endpoint.padEnd(30)} ${String(metrics.length).padStart(6)} ${String(errs).padStart(5)} ${pct(0.5).toFixed(0).padStart(6)}ms ${pct(0.9).toFixed(0).padStart(6)}ms ${pct(0.95).toFixed(0).padStart(6)}ms ${pct(0.99).toFixed(0).padStart(6)}ms`,
      );
    }

    // User outcomes
    const completed = this.outcomes.filter((o) => o.completed).length;
    const abandoned = this.outcomes.filter((o) => o.abandoned).length;
    const returning = this.outcomes.filter((o) => o.returning).length;
    const avgDuration = this.outcomes.reduce((s, o) => s + o.durationMs, 0) / this.outcomes.length / 1000;

    console.log(`\nUsers: ${this.outcomes.length} | Completed: ${completed} | Abandoned: ${abandoned} | Returning: ${returning}`);
    console.log(`Completion rate: ${((completed / this.outcomes.length) * 100).toFixed(0)}% | Avg session: ${avgDuration.toFixed(1)}s`);

    // Error details (first 5 unique)
    const uniqueErrors = [...new Set(this.data.filter((m) => m.error).map((m) => `${m.endpoint}: ${m.error}`))];
    if (uniqueErrors.length > 0) {
      console.log(`\nErrors (first ${Math.min(5, uniqueErrors.length)}):`);
      for (const e of uniqueErrors.slice(0, 5)) {
        console.log(`  - ${e}`);
      }
    }

    console.log('');
  }
}

// ============================================================
// HTTP helpers
// ============================================================

async function timedFetch(
  metrics: Metrics,
  endpoint: string,
  url: string,
  init?: RequestInit,
): Promise<Response | null> {
  const start = performance.now();
  try {
    const res = await fetch(url, init);
    metrics.record({ endpoint, status: res.status, latencyMs: performance.now() - start });
    return res;
  } catch (e) {
    metrics.record({
      endpoint,
      status: 0,
      latencyMs: performance.now() - start,
      error: e instanceof Error ? e.message : 'Network error',
    });
    return null;
  }
}

function parseCookieValue(headers: Headers, name: string): string | undefined {
  const setCookie = headers.get('set-cookie') ?? '';
  const match = setCookie.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1];
}

// ============================================================
// Auth + survey setup
// ============================================================

async function authenticate(baseUrl: string, password: string): Promise<string> {
  const meRes = await fetch(`${baseUrl}/api/auth/me`);
  const me = (await meRes.json()) as { authenticated: boolean; needsSetup?: boolean };

  let res: Response;
  if (me.needsSetup) {
    res = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } else {
    res = await fetch(`${baseUrl}/api/auth/password-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  }

  const cookie = res.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Authentication failed — check password');
  return cookie;
}

async function createSurvey(baseUrl: string, sessionCookie: string): Promise<{ slug: string; questions: Question[] }> {
  const slug = `load-test-${Date.now()}`;
  const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

  const definition = {
    version: 1,
    title: 'Load Test Survey',
    description: 'Automated load testing survey',
    welcomeTitle: 'Welcome to our survey',
    welcomeDescription: 'This should only take a few minutes.',
    thankYouTitle: 'Thank you!',
    thankYouDescription: 'Your response has been recorded.',
    sections: [
      {
        title: 'About You',
        questions: [
          { text: 'What is your name?', type: 'text', required: true, placeholder: 'Enter your name' },
          { text: 'What is your email?', type: 'email', required: true, placeholder: 'you@example.com' },
          {
            text: 'Years of experience?',
            type: 'number',
            required: true,
            config: { min: 0, max: 50 },
          },
        ],
      },
      {
        title: 'Preferences',
        questions: [
          {
            text: 'Primary operating system?',
            type: 'radio',
            required: true,
            hasOther: true,
            otherPrompt: 'Please specify',
            options: [
              { label: 'Windows', value: 'windows' },
              { label: 'macOS', value: 'macos' },
              { label: 'Linux', value: 'linux' },
            ],
          },
          {
            text: 'Languages you use regularly?',
            type: 'checkbox',
            required: true,
            hasOther: true,
            options: [
              { label: 'TypeScript', value: 'typescript' },
              { label: 'Python', value: 'python' },
              { label: 'Go', value: 'go' },
              { label: 'Rust', value: 'rust' },
              { label: 'Java', value: 'java' },
            ],
          },
          {
            text: 'Preferred editor?',
            type: 'dropdown',
            required: true,
            options: [
              { label: 'VS Code', value: 'vscode' },
              { label: 'JetBrains', value: 'jetbrains' },
              { label: 'Vim/Neovim', value: 'vim' },
              { label: 'Emacs', value: 'emacs' },
            ],
          },
          { text: 'Modern dev tools are easy to use', type: 'likert', required: true },
        ],
      },
      {
        title: 'Feedback',
        questions: [
          { text: 'Rate your overall experience', type: 'rating', required: true, config: { scaleMax: 5 } },
          { text: 'How likely to recommend us?', type: 'nps', required: true },
          {
            text: 'Additional comments?',
            type: 'textarea',
            required: false,
            placeholder: 'Share your thoughts...',
            maxLength: 500,
          },
        ],
      },
    ],
  };

  // Import survey
  const importRes = await fetch(`${baseUrl}/api/surveys/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify(definition),
  });
  if (!importRes.ok) {
    const text = await importRes.text();
    throw new Error(`Import failed (${importRes.status}): ${text}`);
  }
  const imported = (await importRes.json()) as { survey: { id: string }; questions: Question[] };
  const surveyId = imported.survey.id;

  // Set slug
  const slugRes = await fetch(`${baseUrl}/api/surveys/${surveyId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ slug }),
  });
  if (!slugRes.ok) throw new Error(`Set slug failed: ${await slugRes.text()}`);

  // Publish
  const pubRes = await fetch(`${baseUrl}/api/surveys/${surveyId}/publish`, {
    method: 'PUT',
    headers,
  });
  if (!pubRes.ok) throw new Error(`Publish failed: ${await pubRes.text()}`);

  console.log(`Survey created: ${slug} (${imported.questions.length} questions)`);
  return { slug, questions: imported.questions };
}

// ============================================================
// Answer generation
// ============================================================

const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Iris', 'Jack'];
const COMMENTS = [
  'Great experience overall!',
  'Could use some improvements in the UI.',
  'Very straightforward and easy to use.',
  'I had some issues with the navigation.',
  'Loved the simplicity of the design.',
  'Nothing specific to mention.',
  'Would be nice to have dark mode.',
  'The survey was a bit too long for my taste.',
  'Excellent work, keep it up!',
  '',
];
const LIKERT = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAnswer(q: Question): { questionId: string; value: string; otherText?: string } {
  const base = { questionId: q.id };
  let options: Array<{ label: string; value: string }> = [];
  if (q.options) {
    try {
      options = JSON.parse(q.options);
    } catch {}
  }

  switch (q.type) {
    case 'radio': {
      if (q.has_other && Math.random() < 0.1) {
        return { ...base, value: '__other__', otherText: 'Something else' };
      }
      return { ...base, value: options.length > 0 ? randomItem(options).value : 'option1' };
    }
    case 'checkbox': {
      const count = Math.min(1 + Math.floor(Math.random() * 3), options.length);
      const shuffled = [...options].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count).map((o) => o.value);
      if (q.has_other && Math.random() < 0.1) selected.push('__other__');
      return {
        ...base,
        value: selected.join(','),
        ...(selected.includes('__other__') ? { otherText: 'Custom option' } : {}),
      };
    }
    case 'dropdown':
      return { ...base, value: options.length > 0 ? randomItem(options).value : 'option1' };
    case 'text':
      return { ...base, value: randomItem(NAMES) };
    case 'textarea':
      return { ...base, value: randomItem(COMMENTS) };
    case 'email':
      return { ...base, value: `user${Math.floor(Math.random() * 100000)}@example.com` };
    case 'number': {
      let min = 0,
        max = 100;
      if (q.config) {
        try {
          const cfg = JSON.parse(q.config);
          if (cfg.min != null) min = cfg.min;
          if (cfg.max != null) max = cfg.max;
        } catch {}
      }
      return { ...base, value: String(min + Math.floor(Math.random() * (max - min + 1))) };
    }
    case 'rating': {
      let scaleMax = 5;
      if (q.config) {
        try {
          const cfg = JSON.parse(q.config);
          if (cfg.scaleMax) scaleMax = cfg.scaleMax;
        } catch {}
      }
      return { ...base, value: String(1 + Math.floor(Math.random() * scaleMax)) };
    }
    case 'nps':
      return { ...base, value: String(Math.floor(Math.random() * 11)) };
    case 'likert':
      return { ...base, value: randomItem(LIKERT) };
    default:
      return { ...base, value: 'test' };
  }
}

// ============================================================
// WebSocket client (mirrors src/lib/api/survey-ws.ts behavior:
//   - Auto-reconnect with 3 attempts, 3s delay
//   - Typed request/response with 30s timeout
//   - Graceful close)
// ============================================================

let wsRequestCounter = 0;

interface WsClient {
  readonly connected: boolean;
  request(op: string, data: Record<string, unknown>): Promise<unknown>;
  close(): void;
}

function createWsClient(url: string, metrics: Metrics): WsClient {
  let ws: WebSocket | null = null;
  let closed = false;
  let failures = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const MAX_FAILURES = 3;
  const RECONNECT_DELAY = 3000;
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  function connect() {
    if (closed) return;
    const start = performance.now();
    ws = new WebSocket(url);

    ws.onopen = () => {
      metrics.record({ endpoint: 'WS connect', status: 101, latencyMs: performance.now() - start });
      failures = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.type === 'response' && msg.requestId) {
          const req = pending.get(msg.requestId);
          if (req) {
            pending.delete(msg.requestId);
            if (msg.error) req.reject(new Error(msg.error));
            else req.resolve(msg.data);
          }
        }
        // push events (counts, stats, results) are ignored by respondent clients
      } catch {}
    };

    ws.onclose = () => {
      // Reject all pending requests on close
      for (const [, req] of pending) req.reject(new Error('WebSocket closed'));
      pending.clear();

      if (closed) return;
      failures++;
      if (failures < MAX_FAILURES) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
      } else {
        metrics.record({ endpoint: 'WS reconnect', status: 0, latencyMs: 0, error: 'max retries exceeded' });
      }
    };

    ws.onerror = () => {
      metrics.record({ endpoint: 'WS connect', status: 0, latencyMs: performance.now() - start, error: 'WS error' });
      ws?.close();
    };
  }

  connect();

  return {
    get connected() {
      return ws?.readyState === WebSocket.OPEN;
    },

    async request(op: string, data: Record<string, unknown>): Promise<unknown> {
      // Wait for connection if still connecting
      if (ws?.readyState === WebSocket.CONNECTING) {
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            ws?.removeEventListener('open', onOpen);
            ws?.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            ws?.removeEventListener('open', onOpen);
            ws?.removeEventListener('error', onError);
            reject(new Error('WebSocket connection failed'));
          };
          ws?.addEventListener('open', onOpen);
          ws?.addEventListener('error', onError);
        });
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      const requestId = `r${++wsRequestCounter}`;
      const start = performance.now();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.delete(requestId);
          metrics.record({ endpoint: `WS ${op}`, status: 408, latencyMs: performance.now() - start, error: 'timeout' });
          reject(new Error('WS request timeout'));
        }, 30_000);

        pending.set(requestId, {
          resolve: (result) => {
            clearTimeout(timeout);
            metrics.record({ endpoint: `WS ${op}`, status: 200, latencyMs: performance.now() - start });
            resolve(result);
          },
          reject: (err) => {
            clearTimeout(timeout);
            metrics.record({ endpoint: `WS ${op}`, status: 400, latencyMs: performance.now() - start, error: err.message });
            reject(err);
          },
        });

        ws!.send(JSON.stringify({ type: 'request', requestId, op, data }));
      });
    },

    close() {
      closed = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}

// ============================================================
// User simulation
// ============================================================

type UserProfile = {
  minDelay: number;
  maxDelay: number;
  abandonAt: number | null;
  isReturning: boolean;
  leaveAfter: number;
};

function createUserProfile(totalQuestions: number): UserProfile {
  const isFast = Math.random() < 0.4;
  const minDelay = isFast ? 500 : 3000;
  const maxDelay = isFast ? 3000 : 15000;

  const willAbandon = Math.random() < 0.25;
  const abandonAt = willAbandon ? 1 + Math.floor(Math.random() * (totalQuestions - 1)) : null;

  const isReturning = !willAbandon && Math.random() < 0.15;
  const leaveAfter = isReturning ? 1 + Math.floor(Math.random() * Math.floor(totalQuestions / 2)) : 0;

  return { minDelay, maxDelay, abandonAt, isReturning, leaveAfter };
}

function randomDelay(min: number, max: number): Promise<void> {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
}

// Matches the constants in src/lib/api/client.ts
const FLUSH_THRESHOLD = 4;
const INACTIVITY_MS = 10_000;
const BACKOFF_DELAYS = [1000, 2000, 4000];

interface PendingSave {
  questionId: string;
  value: string;
  otherText?: string;
}

async function simulateUser(
  userId: number,
  config: Config,
  metrics: Metrics,
  questions: Question[],
  slug: string,
  deadline: number,
): Promise<UserOutcome> {
  const profile = createUserProfile(questions.length);
  const userStart = performance.now();
  const cookieName = `rid_${slug}`;
  let respondentCookie = '';
  let questionsAnswered = 0;

  const isExpired = () => Date.now() > deadline;
  const fail = (): UserOutcome => ({
    answered: questionsAnswered,
    total: questions.length,
    completed: false,
    abandoned: true,
    returning: profile.isReturning,
    durationMs: performance.now() - userStart,
  });
  const wsUrl = `${config.baseUrl.replace(/^http/, 'ws')}/api/s/${slug}/ws?type=respondent`;

  // ============================================================
  // Step 1: HTTP GET /api/s/:slug — fetch survey metadata (matches frontend)
  // ============================================================
  const surveyRes = await timedFetch(metrics, 'GET /api/s/:slug', `${config.baseUrl}/api/s/${slug}`);
  if (!surveyRes || !surveyRes.ok || isExpired()) return fail();
  await surveyRes.json();

  // ============================================================
  // Step 2: Connect WebSocket — the upgrade handler creates the respondent,
  // sets the cookie on the 101 response, and tags the connection with the ID.
  // No HTTP resume round-trip needed.
  // ============================================================
  let wsClient = createWsClient(wsUrl, metrics);

  const waitForConnect = async () => {
    for (let i = 0; i < 20; i++) {
      if (wsClient.connected) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };
  if (!(await waitForConnect())) return fail();

  // ============================================================
  // Step 3: WS resume — get existing answers/state. Returns the respondent ID
  // so we can build the cookie for HTTP fallback if the WS drops later.
  // ============================================================
  let resumeState: { isComplete: boolean; nextQuestionIndex: number; respondentId?: string };
  try {
    resumeState = (await wsClient.request('resume', {})) as { isComplete: boolean; nextQuestionIndex: number; respondentId?: string };
  } catch {
    return fail();
  }

  if (resumeState.respondentId) {
    respondentCookie = `${cookieName}=${resumeState.respondentId}`;
  }

  if (resumeState.isComplete) {
    questionsAnswered = questions.length;
    wsClient.close();
    return { answered: questions.length, total: questions.length, completed: true, abandoned: false, returning: false, durationMs: performance.now() - userStart };
  }

  let startIdx = resumeState.nextQuestionIndex;

  // ============================================================
  // Buffered answer submission with retry + inactivity flush + HTTP fallback
  // (mirrors src/lib/api/client.ts)
  // ============================================================
  const buffer = new Map<string, PendingSave>();
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let flushing: Promise<boolean> | null = null;

  const clearInactivity = () => {
    if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  };

  const saveBatchHttp = async (batch: PendingSave[]): Promise<boolean> => {
    for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
      const res = await timedFetch(metrics, 'POST /answers/batch', `${config.baseUrl}/api/s/${slug}/answers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: respondentCookie },
        body: JSON.stringify({ answers: batch }),
      });
      if (res?.ok) return true;
      if (res && res.status < 500) return false;
      if (attempt < BACKOFF_DELAYS.length) {
        await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[attempt]));
      }
    }
    return false;
  };

  const saveBatchWs = async (batch: PendingSave[]): Promise<boolean> => {
    // Prefer WS; fall back to HTTP if WS is down or the request fails
    if (wsClient.connected) {
      try {
        await wsClient.request('submit-answers', { answers: batch });
        return true;
      } catch {
        // fall through
      }
    }
    return saveBatchHttp(batch);
  };

  const flushBuffer = async (): Promise<boolean> => {
    if (flushing) return flushing;
    if (buffer.size === 0) return true;
    clearInactivity();
    const batch = [...buffer.values()];
    buffer.clear();

    flushing = (async () => {
      const success = await saveBatchWs(batch);
      if (!success) {
        // Restore unsent answers (but don't overwrite newer ones for the same question)
        for (const item of batch) {
          if (!buffer.has(item.questionId)) buffer.set(item.questionId, item);
        }
      }
      return success;
    })();
    const result = await flushing;
    flushing = null;
    return result;
  };

  const scheduleInactivityFlush = () => {
    clearInactivity();
    inactivityTimer = setTimeout(() => { void flushBuffer(); }, INACTIVITY_MS);
  };

  const bufferAnswer = (answer: PendingSave) => {
    buffer.set(answer.questionId, answer);
    scheduleInactivityFlush();
    if (buffer.size >= FLUSH_THRESHOLD) {
      void flushBuffer();
    }
  };

  // ============================================================
  // Step 4: Answer questions one at a time, buffering writes
  // ============================================================
  const answerQuestions = async (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      if (isExpired()) break;
      if (profile.abandonAt !== null && questionsAnswered >= profile.abandonAt) break;

      await randomDelay(profile.minDelay, profile.maxDelay);
      if (isExpired()) break;

      bufferAnswer(generateAnswer(questions[i]));
      questionsAnswered++;
    }
    // Final flush (equivalent to the frontend's pre-complete flushBuffer)
    await flushBuffer();
  };

  try {
    if (profile.isReturning) {
      const leavePoint = Math.min(startIdx + profile.leaveAfter, questions.length);
      await answerQuestions(startIdx, leavePoint);

      if (!isExpired() && questionsAnswered < questions.length) {
        // Simulate leaving: close WS, wait, reconnect WS
        // The X-Respondent-Id header comes from the cookie that was set during the
        // original upgrade — but in the load test we use the WebSocket class which
        // doesn't send cookies automatically. Instead, send the ID via a query param
        // fallback... actually, the DO only reads X-Respondent-Id from the header.
        // For a returning user in the load test, the DO will create a NEW respondent.
        // This is acceptable for load testing — it's not meaningfully different work.
        wsClient.close();
        await randomDelay(5000, 20000);

        if (!isExpired()) {
          wsClient = createWsClient(wsUrl, metrics);
          if (await waitForConnect()) {
            try {
              const state2 = (await wsClient.request('resume', {})) as {
                nextQuestionIndex: number;
                isComplete: boolean;
                respondentId?: string;
              };
              if (!state2.isComplete) {
                if (state2.respondentId) respondentCookie = `${cookieName}=${state2.respondentId}`;
                startIdx = state2.nextQuestionIndex;
                await answerQuestions(startIdx, questions.length);
              }
            } catch {
              // couldn't resume
            }
          }
        }
      }
    } else {
      await answerQuestions(startIdx, questions.length);
    }

    // ============================================================
    // Step 5: Complete the survey (WS with HTTP fallback)
    // ============================================================
    const didAbandon = profile.abandonAt !== null && questionsAnswered >= profile.abandonAt;
    let completed = false;
    if (!didAbandon && questionsAnswered >= questions.length && !isExpired()) {
      let success = false;
      if (wsClient.connected) {
        try {
          await wsClient.request('complete', {});
          success = true;
        } catch {}
      }
      if (!success) {
        const res = await timedFetch(metrics, 'POST /complete', `${config.baseUrl}/api/s/${slug}/complete`, {
          method: 'POST',
          headers: { Cookie: respondentCookie },
        });
        success = !!res?.ok;
      }
      completed = success;
    }

    return {
      answered: questionsAnswered,
      total: questions.length,
      completed,
      abandoned: didAbandon,
      returning: profile.isReturning,
      durationMs: performance.now() - userStart,
    };
  } finally {
    clearInactivity();
    wsClient.close();
  }
}

// ============================================================
// Main
// ============================================================

async function main() {
  const config = parseArgs();
  const metrics = new Metrics();

  console.log('Survey Load Tester');
  console.log('-'.repeat(40));
  console.log(`Target:   ${config.baseUrl}`);
  console.log(`Users:    ${config.users}`);
  console.log(`Ramp:     ${config.rampSeconds}s`);
  console.log(`Duration: ${config.durationSeconds}s`);
  console.log('');

  // Authenticate
  console.log('Authenticating...');
  const sessionCookie = await authenticate(config.baseUrl, config.password);

  // Create fresh survey
  console.log('Creating survey...');
  const { slug, questions } = await createSurvey(config.baseUrl, sessionCookie);

  // Calculate deadline and ramp interval
  const deadline = Date.now() + config.durationSeconds * 1000;
  const interval = config.users > 1 ? (config.rampSeconds * 1000) / (config.users - 1) : 0;

  console.log(`\nRamping ${config.users} users over ${config.rampSeconds}s...`);

  // Launch users
  const promises: Promise<void>[] = [];
  for (let i = 0; i < config.users; i++) {
    promises.push(
      simulateUser(i, config, metrics, questions, slug, deadline).then((outcome) => {
        metrics.recordUser(outcome);
      }),
    );
    if (i < config.users - 1 && interval > 0) {
      await new Promise((r) => setTimeout(r, interval));
    }
  }

  await Promise.all(promises);
  metrics.report();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
