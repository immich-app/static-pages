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

type FailureMode =
  | 'none' // success or intentional abandon
  | 'load' // HTTP GET /api/s/:slug failed — never saw the survey
  | 'session' // couldn't establish a session (neither WS nor HTTP resume worked)
  | 'answers' // session started but no answers went through
  | 'complete' // answered everything but complete call failed (WS + HTTP both failed)
  | 'deadline'; // ran out of test duration before completing — test config issue, not a real failure

interface UserOutcome {
  answered: number;
  total: number;
  completed: boolean;
  abandoned: boolean; // intentional (profile-driven), not a failure
  returning: boolean;
  durationMs: number;

  // Failure categorization — what blocked this user from completing
  failure: FailureMode;

  // WS observability
  wsConnectFailed: boolean; // WS never connected despite retries
  usedHttpFallback: boolean; // HTTP was used at least once as a fallback
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

  report(actualCounts?: { total: number; completed: number } | null) {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const total = this.data.length;
    const errors = this.data.filter((m) => m.status >= 400 || m.status === 0).length;

    console.log('\n' + '='.repeat(70));
    console.log('LOAD TEST RESULTS');
    console.log('='.repeat(70));

    console.log(
      `\nDuration: ${elapsed.toFixed(1)}s | Total requests: ${total} | Errors: ${errors} (${((errors / total) * 100).toFixed(1)}%)`,
    );
    console.log(`Throughput: ${(total / elapsed).toFixed(1)} req/s`);

    // Per-endpoint breakdown
    const endpoints = new Map<string, Metric[]>();
    for (const m of this.data) {
      const group = endpoints.get(m.endpoint) ?? [];
      group.push(m);
      endpoints.set(m.endpoint, group);
    }

    console.log(
      `\n${'Endpoint'.padEnd(30)} ${'Count'.padStart(6)} ${'Errs'.padStart(5)} ${'p50'.padStart(7)} ${'p90'.padStart(7)} ${'p95'.padStart(7)} ${'p99'.padStart(7)}`,
    );
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
    const total_users = this.outcomes.length;
    const completed = this.outcomes.filter((o) => o.completed).length;
    const abandoned = this.outcomes.filter((o) => o.abandoned && !o.completed).length;
    const returning = this.outcomes.filter((o) => o.returning).length;
    const avgDuration = this.outcomes.reduce((s, o) => s + o.durationMs, 0) / total_users / 1000;

    // WS observability
    const wsConnectFailed = this.outcomes.filter((o) => o.wsConnectFailed).length;
    const usedHttpFallback = this.outcomes.filter((o) => o.usedHttpFallback).length;
    const wsFailedButCompleted = this.outcomes.filter((o) => o.wsConnectFailed && o.completed).length;
    const wsFailedAndFailed = this.outcomes.filter((o) => o.wsConnectFailed && o.failure !== 'none').length;

    // Failure breakdown
    const failures = this.outcomes.filter((o) => o.failure !== 'none');
    const failureBreakdown = {
      load: failures.filter((o) => o.failure === 'load').length,
      session: failures.filter((o) => o.failure === 'session').length,
      answers: failures.filter((o) => o.failure === 'answers').length,
      complete: failures.filter((o) => o.failure === 'complete').length,
    };
    const realFailures =
      failureBreakdown.load + failureBreakdown.session + failureBreakdown.answers + failureBreakdown.complete;
    const deadlineCutoffs = this.outcomes.filter((o) => o.failure === 'deadline').length;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`USER OUTCOMES (${total_users} total)`);
    console.log('='.repeat(70));
    console.log(
      `  Completed successfully:  ${String(completed).padStart(5)}  (${((completed / total_users) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Abandoned (intentional): ${String(abandoned).padStart(5)}  (${((abandoned / total_users) * 100).toFixed(1)}%)`,
    );
    if (deadlineCutoffs > 0) {
      console.log(
        `  Cut off by --duration:   ${String(deadlineCutoffs).padStart(5)}  (${((deadlineCutoffs / total_users) * 100).toFixed(1)}%)  ← NOT a failure, test config`,
      );
    }
    console.log(
      `  FAILED (server issue):   ${String(realFailures).padStart(5)}  (${((realFailures / total_users) * 100).toFixed(1)}%)`,
    );
    if (realFailures > 0) {
      console.log(`    - load failed (never saw survey):     ${failureBreakdown.load}`);
      console.log(`    - session failed (couldn't resume):   ${failureBreakdown.session}`);
      console.log(`    - couldn't submit any answers:        ${failureBreakdown.answers}`);
      console.log(`    - couldn't submit complete:           ${failureBreakdown.complete}`);
    }
    console.log(`  Returning users: ${returning} | Avg session: ${avgDuration.toFixed(1)}s`);

    if (actualCounts) {
      const expected = total_users;
      const match = actualCounts.total === expected ? '✓' : `✗ (expected ${expected})`;
      console.log(
        `  Server-side respondents: ${actualCounts.total} total, ${actualCounts.completed} completed  ${match}`,
      );
    }

    if (deadlineCutoffs > 0) {
      console.log(
        `\n  ⚠  ${deadlineCutoffs} user${deadlineCutoffs === 1 ? '' : 's'} were cut off by the test duration.`,
      );
      console.log(`     Increase --duration to let them finish, or these could also skew completion rate.`);
    }

    console.log(`\n${'-'.repeat(70)}`);
    console.log('WS RESILIENCE');
    console.log('-'.repeat(70));
    console.log(
      `  Users with WS connect failures:      ${wsConnectFailed}  (${((wsConnectFailed / total_users) * 100).toFixed(1)}%)`,
    );
    console.log(`    → successfully completed anyway:   ${wsFailedButCompleted}  (fallback worked)`);
    console.log(`    → ultimately failed:               ${wsFailedAndFailed}`);
    console.log(
      `  Users who used HTTP fallback at all: ${usedHttpFallback}  (${((usedHttpFallback / total_users) * 100).toFixed(1)}%)`,
    );

    // Error breakdown — grouped by endpoint and error message, with counts
    const errorGroups = new Map<string, number>();
    for (const m of this.data) {
      if (!m.error) continue;
      // Normalize "retry in Xms" to make messages comparable
      const normalized = m.error.replace(/retry in \d+ms/, 'retry');
      const key = `${m.endpoint}: ${normalized}`;
      errorGroups.set(key, (errorGroups.get(key) ?? 0) + 1);
    }

    if (errorGroups.size > 0) {
      console.log(`\n${'-'.repeat(70)}`);
      console.log('ERROR BREAKDOWN');
      console.log('-'.repeat(70));
      // Sort by count descending
      const sorted = [...errorGroups.entries()].sort((a, b) => b[1] - a[1]);
      for (const [err, count] of sorted.slice(0, 10)) {
        console.log(`  ${String(count).padStart(5)}  ${err}`);
      }
      if (sorted.length > 10) {
        console.log(`  ... and ${sorted.length - 10} more unique errors`);
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
  return { slug, questions: imported.questions, surveyId };
}

async function fetchActualRespondentCount(
  baseUrl: string,
  sessionCookie: string,
  surveyId: string,
): Promise<{ total: number; completed: number } | null> {
  try {
    const res = await fetch(`${baseUrl}/api/surveys/${surveyId}/results`, {
      headers: { Cookie: sessionCookie },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { respondentCounts?: { total: number; completed: number } };
    return data.respondentCounts ?? null;
  } catch {
    return null;
  }
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
// WebSocket client using the `ws` package for real Error objects and
// Cookie header support (Node's built-in WebSocket doesn't let you set
// either, which gives generic 'WS error' diagnostics and means returning
// users can't reuse their respondent cookie on reconnect).
// ============================================================

import WebSocketClass from 'ws';
type WsInstance = InstanceType<typeof WebSocketClass>;

let wsRequestCounter = 0;

interface WsClient {
  readonly connected: boolean;
  request(op: string, data: Record<string, unknown>): Promise<unknown>;
  close(): void;
}

function createWsClient(url: string, metrics: Metrics, initialCookie?: string): WsClient {
  let ws: WsInstance | null = null;
  let closed = false;
  let failures = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const MAX_FAILURES = 5;
  const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  // Track whether the connection was ever established — if not, upcoming close
  // events count as connect failures, not mid-session drops
  let everConnected = false;
  // Cookie used on reconnects. Starts with the caller-supplied cookie (if any),
  // and is updated from the server's Set-Cookie on successful upgrades so that
  // retries reuse the same respondent identity.
  let cookie = initialCookie;

  // Exponential backoff with jitter to avoid thundering-herd on shared failure modes.
  // Base delays: 0.5s, 1s, 2s, 4s, 8s — each ±50% jitter applied on top.
  const computeBackoff = (attempt: number): number => {
    const base = 500 * Math.pow(2, Math.min(attempt, 4));
    const jitter = base * (0.5 + Math.random()); // 0.5× to 1.5×
    return jitter;
  };

  function connect() {
    if (closed) return;
    const start = performance.now();
    const opts: ConstructorParameters<typeof WebSocketClass>[2] = {};
    if (cookie) opts.headers = { Cookie: cookie };
    ws = new WebSocketClass(url, opts);

    // Capture Set-Cookie from the upgrade response so reconnects reuse the
    // same respondent instead of creating a fresh one each time.
    ws.on('upgrade', (res) => {
      const setCookie = res.headers['set-cookie'];
      const headers = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
      for (const h of headers) {
        const match = h.match(/(rid_[^=]+=[^;]+)/);
        if (match) {
          cookie = match[1];
          break;
        }
      }
    });

    ws.on('open', () => {
      everConnected = true;
      metrics.record({ endpoint: 'WS connect', status: 101, latencyMs: performance.now() - start });
      failures = 0;
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'response' && msg.requestId) {
          const req = pending.get(msg.requestId);
          if (req) {
            pending.delete(msg.requestId);
            if (msg.error) req.reject(new Error(msg.error));
            else req.resolve(msg.data);
          }
        }
        // push events (counts, stats, results) are ignored by respondent clients
      } catch {
        // ignore malformed messages
      }
    });

    // The `ws` package emits 'unexpected-response' with the HTTP status when the
    // server returns non-101 (e.g. 429 rate limited, 500 server error, 503).
    // This gives us much better diagnostics than generic connect failures.
    ws.on('unexpected-response', (_req, res) => {
      metrics.record({
        endpoint: 'WS connect',
        status: res.statusCode ?? 0,
        latencyMs: performance.now() - start,
        error: `HTTP ${res.statusCode} ${res.statusMessage ?? ''}`.trim(),
      });
    });

    ws.on('error', (err: Error) => {
      // Only record connect errors here — mid-session errors are captured via 'close'
      if (!everConnected) {
        metrics.record({
          endpoint: 'WS connect',
          status: 0,
          latencyMs: performance.now() - start,
          error: err.message || 'WS error',
        });
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      // Reject all pending requests on close
      for (const [, req] of pending) req.reject(new Error('WebSocket closed'));
      pending.clear();

      if (closed) return;

      // Distinguish connect failure vs mid-session drop
      const wasConnected = everConnected;
      everConnected = false; // reset for the next connect attempt

      failures++;
      const reasonStr = reason.length > 0 ? reason.toString() : '';
      if (failures < MAX_FAILURES) {
        const delay = computeBackoff(failures);
        metrics.record({
          endpoint: wasConnected ? 'WS close' : 'WS connect close',
          status: code,
          latencyMs: 0,
          error: `close ${code}${reasonStr ? ' ' + reasonStr : ''}; retry`,
        });
        reconnectTimer = setTimeout(connect, delay);
      } else {
        metrics.record({
          endpoint: 'WS max retries',
          status: code,
          latencyMs: 0,
          error: `max retries exceeded (last code: ${code})`,
        });
      }
    });
  }

  connect();

  return {
    get connected() {
      return ws?.readyState === WebSocketClass.OPEN;
    },

    async request(op: string, data: Record<string, unknown>): Promise<unknown> {
      // Wait for connection if still connecting
      if (ws?.readyState === WebSocketClass.CONNECTING) {
        await new Promise<void>((resolve, reject) => {
          const onOpen = () => {
            ws?.removeListener('open', onOpen);
            ws?.removeListener('error', onError);
            resolve();
          };
          const onError = () => {
            ws?.removeListener('open', onOpen);
            ws?.removeListener('error', onError);
            reject(new Error('WebSocket connection failed'));
          };
          ws?.on('open', onOpen);
          ws?.on('error', onError);
        });
      }

      if (!ws || ws.readyState !== WebSocketClass.OPEN) {
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
            metrics.record({
              endpoint: `WS ${op}`,
              status: 400,
              latencyMs: performance.now() - start,
              error: err.message,
            });
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
  let questionsAnswered = 0;
  let wsConnectFailed = false;
  let hitDeadline = false;
  const usedHttpFallback = false; // never — we're measuring WS-only capacity

  const isExpired = () => {
    if (Date.now() > deadline) {
      hitDeadline = true;
      return true;
    }
    return false;
  };
  const outcome = (failure: FailureMode, extras: Partial<UserOutcome> = {}): UserOutcome => ({
    answered: questionsAnswered,
    total: questions.length,
    completed: false,
    abandoned: false,
    returning: profile.isReturning,
    durationMs: performance.now() - userStart,
    // If the user was cut off by the test duration, report it as a 'deadline'
    // outcome (test config issue) instead of the server-side failure mode that
    // happened to be triggered by the cutoff.
    failure: hitDeadline && failure !== 'load' ? 'deadline' : failure,
    wsConnectFailed,
    usedHttpFallback,
    ...extras,
  });
  const wsUrl = `${config.baseUrl.replace(/^http/, 'ws')}/api/s/${slug}/ws?type=respondent`;

  // ============================================================
  // Step 1: HTTP GET /api/s/:slug — fetch survey metadata (matches frontend)
  // ============================================================
  const surveyRes = await timedFetch(metrics, 'GET /api/s/:slug', `${config.baseUrl}/api/s/${slug}`);
  if (!surveyRes || !surveyRes.ok) return outcome('load');
  await surveyRes.json();
  if (isExpired()) return outcome('none', { abandoned: true });

  // ============================================================
  // Step 2: Connect WebSocket — WS is the only data path. If it fails,
  // that's a real failure (no HTTP fallback since that would trigger
  // per-request cookie auth and reduce server capacity).
  // ============================================================
  let wsClient: WsClient | null = createWsClient(wsUrl, metrics);

  const waitForConnect = async (client: WsClient) => {
    // Wait up to ~13s to match the frontend's 3 retries × 3s delay + initial attempt
    for (let i = 0; i < 130; i++) {
      if (client.connected) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  if (!(await waitForConnect(wsClient))) {
    wsConnectFailed = true;
    wsClient.close();
    wsClient = null;
    return outcome('session');
  }

  // ============================================================
  // Step 3: WS resume — must succeed, no HTTP fallback
  // ============================================================
  let resumeState: { isComplete: boolean; nextQuestionIndex: number; respondentId?: string };
  try {
    resumeState = (await wsClient.request('resume', {})) as {
      isComplete: boolean;
      nextQuestionIndex: number;
      respondentId?: string;
    };
  } catch {
    wsClient.close();
    return outcome('session');
  }

  if (resumeState.isComplete) {
    questionsAnswered = questions.length;
    wsClient.close();
    return {
      answered: questions.length,
      total: questions.length,
      completed: true,
      abandoned: false,
      returning: false,
      durationMs: performance.now() - userStart,
      failure: 'none',
      wsConnectFailed,
      usedHttpFallback,
    };
  }

  // Build the cookie string so reconnects (returning users) reuse the same
  // respondent instead of creating a new one on each WS upgrade.
  const respondentCookie = resumeState.respondentId ? `rid_${slug}=${resumeState.respondentId}` : undefined;

  let startIdx = resumeState.nextQuestionIndex;

  // ============================================================
  // Buffered answer submission via WS only (no HTTP fallback).
  // On WS failure, answers are re-buffered and retried on the next flush
  // after the WS auto-reconnect has had a chance to restore the connection.
  // ============================================================
  const buffer = new Map<string, PendingSave>();
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let flushing: Promise<boolean> | null = null;
  let consecutiveFailures = 0;
  const MAX_FLUSH_FAILURES = 5; // give up after this many consecutive failed flushes

  const clearInactivity = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  };

  const saveBatchWs = async (batch: PendingSave[]): Promise<boolean> => {
    if (!wsClient || !wsClient.connected) return false;
    try {
      await wsClient.request('submit-answers', { answers: batch });
      return true;
    } catch {
      return false;
    }
  };

  const flushBuffer = async (): Promise<boolean> => {
    if (flushing) return flushing;
    if (buffer.size === 0) return true;
    clearInactivity();
    const batch = [...buffer.values()];
    buffer.clear();

    flushing = (async () => {
      const success = await saveBatchWs(batch);
      if (success) {
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
        // Restore unsent answers so the next flush retries them
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
    inactivityTimer = setTimeout(() => {
      void flushBuffer();
    }, INACTIVITY_MS);
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
      if (consecutiveFailures >= MAX_FLUSH_FAILURES) break;

      await randomDelay(profile.minDelay, profile.maxDelay);
      if (isExpired()) break;

      bufferAnswer(generateAnswer(questions[i]));
      questionsAnswered++;
    }
    // Final flush — retry a few times via inactivity-timer-like loop if WS is recovering
    for (let attempt = 0; attempt < 3; attempt++) {
      if (buffer.size === 0) break;
      const ok = await flushBuffer();
      if (ok) break;
      // Wait for possible WS reconnect
      await new Promise((r) => setTimeout(r, BACKOFF_DELAYS[Math.min(attempt, BACKOFF_DELAYS.length - 1)]));
    }
  };

  try {
    if (profile.isReturning) {
      const leavePoint = Math.min(startIdx + profile.leaveAfter, questions.length);
      await answerQuestions(startIdx, leavePoint);

      if (!isExpired() && questionsAnswered < questions.length && consecutiveFailures < MAX_FLUSH_FAILURES) {
        // Simulate leaving: close WS, wait, reconnect with the cookie so the
        // server recognises the same respondent instead of creating a new one.
        wsClient.close();
        wsClient = null;
        await randomDelay(5000, 20000);

        if (!isExpired()) {
          wsClient = createWsClient(wsUrl, metrics, respondentCookie);
          if (await waitForConnect(wsClient)) {
            try {
              const state2 = (await wsClient.request('resume', {})) as {
                nextQuestionIndex: number;
                isComplete: boolean;
                respondentId?: string;
              };
              if (!state2.isComplete) {
                startIdx = state2.nextQuestionIndex;
                await answerQuestions(startIdx, questions.length);
              }
            } catch {
              // couldn't resume on reconnect — the answer loop will end naturally
            }
          } else {
            wsConnectFailed = true;
          }
        }
      }
    } else {
      await answerQuestions(startIdx, questions.length);
    }

    // ============================================================
    // Step 5: Complete the survey via WS only
    // ============================================================
    const didAbandon = profile.abandonAt !== null && questionsAnswered >= profile.abandonAt;
    if (didAbandon) {
      return {
        answered: questionsAnswered,
        total: questions.length,
        completed: false,
        abandoned: true,
        returning: profile.isReturning,
        durationMs: performance.now() - userStart,
        failure: 'none',
        wsConnectFailed,
        usedHttpFallback,
      };
    }

    // Couldn't submit answers we wanted to submit (WS kept failing)
    if (questionsAnswered < questions.length) {
      // If we got zero answers through, it's an 'answers' failure
      // If we got some but not all, it's still an 'answers' failure (partial submit)
      return outcome('answers');
    }

    // Try to complete via WS
    if (!wsClient || !wsClient.connected || isExpired()) {
      return outcome('complete');
    }

    try {
      await wsClient.request('complete', {});
    } catch {
      return outcome('complete');
    }

    return {
      answered: questionsAnswered,
      total: questions.length,
      completed: true,
      abandoned: false,
      returning: profile.isReturning,
      durationMs: performance.now() - userStart,
      failure: 'none',
      wsConnectFailed,
      usedHttpFallback,
    };
  } finally {
    clearInactivity();
    wsClient?.close();
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
  const { slug, questions, surveyId } = await createSurvey(config.baseUrl, sessionCookie);

  // Calculate deadline and ramp interval
  const deadline = Date.now() + config.durationSeconds * 1000;
  const interval = config.users > 1 ? (config.rampSeconds * 1000) / (config.users - 1) : 0;

  // Estimate if --duration is long enough for the slowest users to finish.
  // Slow users: minDelay=3s, maxDelay=15s → avg 9s per question (worst case ~15s).
  // A user started at the end of the ramp has: (duration - rampSeconds) seconds left.
  // For reliable completion, that should cover worst-case delay × question count.
  const worstCaseSecsPerUser = questions.length * 15; // matches createUserProfile slow bound
  const minRecommendedDuration = config.rampSeconds + worstCaseSecsPerUser + 5;
  if (config.durationSeconds < minRecommendedDuration) {
    console.log(
      `\n⚠  Warning: --duration ${config.durationSeconds}s may be too short for ${questions.length} questions.`,
    );
    console.log(`   Slow users need up to ~${worstCaseSecsPerUser}s to answer, plus ${config.rampSeconds}s ramp.`);
    console.log(`   Recommended: --duration ${minRecommendedDuration} (or higher). Users cut short will be`);
    console.log(`   reported under "Cut off by --duration" in the results.`);
  }

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

  // Query the actual respondent count from the server so we can verify the
  // load test's expected count matches what was persisted.
  const actualCounts = await fetchActualRespondentCount(config.baseUrl, sessionCookie, surveyId);
  metrics.report(actualCounts);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
