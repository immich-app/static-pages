/**
 * E2E tests for the Durable Object architecture.
 *
 * Tests that per-survey operations work correctly through both HTTP and WebSocket
 * paths, including section/question CRUD, reordering, respondent flow, and results.
 */

import { test, expect, type Page } from '@playwright/test';
import { apiPost, apiPut, apiGet, apiDelete, API, ensureAuth, getAuthHeaders, parseCookie } from './helpers';

let cookie: string;

test.beforeAll(async () => {
  cookie = await ensureAuth();
});

test.beforeEach(async ({ context }) => {
  const BASE = process.env.BASE_URL || 'http://localhost:5173';
  const { name, value } = parseCookie(cookie);
  await context.addCookies([{ name, value, url: BASE }]);
});

// ============================================================
// Helper: create a complete survey via API
// ============================================================

async function createSurvey(slug: string) {
  const survey = await apiPost('/api/surveys', { title: `DO Test ${slug}` });
  const sec = await apiPost(`/api/surveys/${survey.id}/sections`, { title: 'Section 1' });
  const q1 = await apiPost(`/api/surveys/${survey.id}/sections/${sec.id}/questions`, {
    text: 'Your name?',
    type: 'text',
    required: true,
  });
  const q2 = await apiPost(`/api/surveys/${survey.id}/sections/${sec.id}/questions`, {
    text: 'Favorite color?',
    type: 'radio',
    options: [
      { label: 'Red', value: 'Red' },
      { label: 'Blue', value: 'Blue' },
    ],
    required: true,
  });
  await apiPut(`/api/surveys/${survey.id}`, { slug });
  await apiPut(`/api/surveys/${survey.id}/publish`);
  return { surveyId: survey.id, sectionId: sec.id, q1Id: q1.id, q2Id: q2.id, slug };
}

// ============================================================
// Section/Question CRUD via HTTP (self-hosted fallback)
// ============================================================

test.describe('Section and question CRUD', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'CRUD Test' });
    surveyId = survey.id;
  });

  test('create section', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'New Section' });
    expect(sec.id).toBeTruthy();
    expect(sec.title).toBe('New Section');
  });

  test('update section', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Before' });
    const updated = await apiPut(`/api/surveys/${surveyId}/sections/${sec.id}`, { title: 'After' });
    expect(updated.title).toBe('After');
  });

  test('delete section', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'To Delete' });
    const res = await apiDelete(`/api/surveys/${surveyId}/sections/${sec.id}`);
    expect(res.status).toBe(204);
  });

  test('reorder sections', async () => {
    const s1 = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'First' });
    const s2 = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Second' });
    await apiPut(`/api/surveys/${surveyId}/sections/reorder`, {
      items: [
        { id: s2.id, sort_order: 0 },
        { id: s1.id, sort_order: 1 },
      ],
    });
    const data = await apiGet(`/api/surveys/${surveyId}`);
    const ordered = data.sections
      .filter((s: { id: string }) => s.id === s1.id || s.id === s2.id)
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    expect(ordered[0].title).toBe('Second');
    expect(ordered[1].title).toBe('First');
  });

  test('create question', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Q Section' });
    const q = await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'Test Q',
      type: 'text',
    });
    expect(q.id).toBeTruthy();
    expect(q.text).toBe('Test Q');
    expect(q.type).toBe('text');
  });

  test('update question', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Q Update' });
    const q = await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'Before',
      type: 'text',
    });
    const updated = await apiPut(`/api/surveys/${surveyId}/questions/${q.id}`, { text: 'After' });
    expect(updated.text).toBe('After');
  });

  test('delete question', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Q Delete' });
    const q = await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'To Delete',
      type: 'text',
    });
    const res = await apiDelete(`/api/surveys/${surveyId}/questions/${q.id}`);
    expect(res.status).toBe(204);
  });

  test('reorder questions', async () => {
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'Q Reorder' });
    const q1 = await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'First Q',
      type: 'text',
    });
    const q2 = await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'Second Q',
      type: 'text',
    });
    await apiPut(`/api/surveys/${surveyId}/sections/${sec.id}/questions/reorder`, {
      items: [
        { id: q2.id, sort_order: 0 },
        { id: q1.id, sort_order: 1 },
      ],
    });
    const data = await apiGet(`/api/surveys/${surveyId}`);
    const secQs = data.questions
      .filter((q: { section_id: string }) => q.section_id === sec.id)
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    expect(secQs[0].text).toBe('Second Q');
    expect(secQs[1].text).toBe('First Q');
  });
});

// ============================================================
// Full respondent flow via HTTP (answers, complete, results)
// ============================================================

test.describe('Respondent flow', () => {
  const slug = `do-respondent-${Date.now()}`;
  let surveyId: string;
  let q1Id: string;
  let q2Id: string;

  test.beforeAll(async () => {
    const result = await createSurvey(slug);
    surveyId = result.surveyId;
    q1Id = result.q1Id;
    q2Id = result.q2Id;
  });

  test('take survey as respondent without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/s/${slug}`);
    await expect(page.locator('h1')).toContainText('DO Test');

    // Get Started
    await page.click('button:has-text("Get Started")');
    // Section intro — Continue
    await page.click('button:has-text("Continue")');

    // Q1 — text input
    await page.locator('input').first().fill('E2E Respondent');
    await page.click('button:has-text("Next")');

    // Q2 — radio
    await page.getByText('Blue', { exact: true }).click();
    await page.click('button:has-text("Submit")');

    // Thank you screen
    await expect(page.locator('h1')).toContainText('Thank you', { timeout: 10000 });

    // No JS errors
    expect(errors).toEqual([]);
  });

  test('results show the respondent data', async () => {
    // Create a respondent via API to ensure data exists
    const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0];
    expect(ridCookie).toBeTruthy();

    await fetch(`${API}/api/s/${slug}/answers/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ridCookie! },
      body: JSON.stringify({
        answers: [
          { questionId: q1Id, value: 'API Respondent' },
          { questionId: q2Id, value: 'Red' },
        ],
      }),
    });
    await fetch(`${API}/api/s/${slug}/complete`, {
      method: 'POST',
      headers: { Cookie: ridCookie! },
    });

    const results = await apiGet(`/api/surveys/${surveyId}/results`);
    expect(results.respondentCounts.total).toBeGreaterThanOrEqual(1);
    expect(results.respondentCounts.completed).toBeGreaterThanOrEqual(1);
    expect(results.results.length).toBeGreaterThan(0);
  });

  test('a client-supplied X-Respondent-Id header is ignored (creates a new respondent)', async () => {
    // Start a real session so we have a known-valid respondent ID
    const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0];
    expect(ridCookie).toBeTruthy();
    const legitId = ridCookie!.split('=')[1];

    // Now make a fresh request with NO cookie but a forged X-Respondent-Id
    // matching the legit respondent. The API worker must strip the header
    // before forwarding to the DO, so the DO should allocate a brand-new
    // respondent (evidenced by returning a fresh Set-Cookie with a different
    // UUID).
    const forgedRes = await fetch(`${API}/api/s/${slug}/resume`, {
      headers: { 'X-Respondent-Id': legitId },
    });
    expect(forgedRes.ok).toBe(true);
    const forgedCookie = forgedRes.headers.get('set-cookie')?.split(';')[0];
    expect(forgedCookie).toBeTruthy();
    const forgedId = forgedCookie!.split('=')[1];
    expect(forgedId).not.toBe(legitId);
  });
});

// ============================================================
// WebSocket protocol
// ============================================================

test.describe('WebSocket protocol', () => {
  const slug = `do-ws-${Date.now()}`;
  let surveyId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(slug);
    surveyId = result.surveyId;
  });

  test('WebSocket connects and receives counts', async ({ page }) => {
    const wsMessages: string[] = [];

    // Intercept WebSocket messages
    await page.addInitScript(() => {
      const origWS = window.WebSocket;
      window.WebSocket = class extends origWS {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          this.addEventListener('message', (e) => {
            (window as any).__wsMessages = (window as any).__wsMessages || [];
            (window as any).__wsMessages.push(e.data);
          });
        }
      } as any;
    });

    await page.goto(`/results/${surveyId}`);
    // Wait for a "counts" push to arrive instead of blindly sleeping 3s.
    await page.waitForFunction(
      () =>
        ((window as any).__wsMessages || [])
          .map((m: string) => {
            try {
              return JSON.parse(m);
            } catch {
              return null;
            }
          })
          .some((m: any) => m && m.type === 'push' && m.event === 'counts'),
      { timeout: 10_000 },
    );

    const messages = await page.evaluate(() => (window as any).__wsMessages || []);
    const parsed = messages.map((m: string) => JSON.parse(m));
    const countsMsgs = parsed.filter((m: any) => m.type === 'push' && m.event === 'counts');
    expect(countsMsgs.length).toBeGreaterThan(0);
    expect(countsMsgs[0].data.activeViewers).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// Editor saves sections and questions via UI
// ============================================================

test.describe('Editor save flow', () => {
  test('create survey, add section and question, save without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to New Survey
    await page.click('a:has-text("New Survey")');
    await page.waitForURL('**/create');

    // Click Blank Survey
    await page.click('button:has-text("Blank Survey")');

    // Fill title
    await page.fill('input[placeholder="Survey title..."]', 'E2E Save Test');

    // Add a section first, then a question
    const addSectionBtn = page.locator('button:has-text("Add section")');
    await addSectionBtn.scrollIntoViewIfNeeded();
    await addSectionBtn.click();
    await page.waitForTimeout(500);

    const shortTextBtn = page.locator('button:has-text("Short Text")').first();
    await shortTextBtn.scrollIntoViewIfNeeded();
    await shortTextBtn.click();
    await page.waitForTimeout(500);

    // Click Save
    await page.click('button:has-text("Save")');
    await page.waitForURL('**/edit/**', { timeout: 10000 });

    // Verify we're on the edit page
    await expect(page.locator('h1')).toContainText('Edit Survey');

    // No JS errors
    expect(errors).toEqual([]);
  });
});

// ============================================================
// Results page loads without errors
// ============================================================

test.describe('Results page', () => {
  const slug = `do-results-${Date.now()}`;
  let surveyId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(slug);
    surveyId = result.surveyId;
  });

  test('results page loads without JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`/results/${surveyId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('DO Test');
    await expect(page.locator('text=Response Timeline')).toBeVisible();

    // No JS errors
    expect(errors).toEqual([]);
  });
});

// ============================================================
// Survey definition export
// ============================================================

test.describe('Survey export/import', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(`do-export-${Date.now()}`);
    surveyId = result.surveyId;
  });

  test('export definition returns valid JSON', async () => {
    const def = await apiGet(`/api/surveys/${surveyId}/definition`);
    expect(def.version).toBe(1);
    expect(def.title).toContain('DO Test');
    expect(def.sections.length).toBeGreaterThan(0);
    expect(def.sections[0].questions.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Publish/unpublish cycle
// ============================================================

test.describe('Publish cycle', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Publish Test' });
    surveyId = survey.id;
    const sec = await apiPost(`/api/surveys/${surveyId}/sections`, { title: 'S1' });
    await apiPost(`/api/surveys/${surveyId}/sections/${sec.id}/questions`, {
      text: 'Q1',
      type: 'text',
    });
    await apiPut(`/api/surveys/${surveyId}`, { slug: `pub-test-${Date.now()}` });
  });

  test('publish and unpublish', async () => {
    const published = await apiPut(`/api/surveys/${surveyId}/publish`);
    expect(published.status).toBe('published');

    const unpublished = await apiPut(`/api/surveys/${surveyId}/unpublish`);
    expect(unpublished.status).toBe('draft');
  });
});

// ============================================================
// Archive/unarchive
// ============================================================

test.describe('Archive cycle', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const survey = await apiPost('/api/surveys', { title: 'Archive Test' });
    surveyId = survey.id;
  });

  test('archive and unarchive', async () => {
    const archived = await apiPut(`/api/surveys/${surveyId}/archive`);
    expect(archived.archived_at).toBeTruthy();

    const unarchived = await apiPut(`/api/surveys/${surveyId}/unarchive`);
    expect(unarchived.archived_at).toBeNull();
  });
});

// ============================================================
// Duplicate survey
// ============================================================

test.describe('Duplicate survey', () => {
  let surveyId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(`dup-source-${Date.now()}`);
    surveyId = result.surveyId;
  });

  test('duplicate creates copy with sections and questions', async () => {
    const dup = await apiPost(`/api/surveys/${surveyId}/duplicate`);
    expect(dup.survey.id).not.toBe(surveyId);
    expect(dup.survey.title).toContain('(Copy)');
    expect(dup.sections.length).toBeGreaterThan(0);
    expect(dup.questions.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Timeline and dropoff analytics
// ============================================================

test.describe('Analytics endpoints', () => {
  const slug = `do-analytics-${Date.now()}`;
  let surveyId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(slug);
    surveyId = result.surveyId;

    // Create a respondent via API
    const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0];
    if (ridCookie) {
      await fetch(`${API}/api/s/${slug}/answers/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ridCookie },
        body: JSON.stringify({ answers: [{ questionId: result.q1Id, value: 'Test' }] }),
      });
      await fetch(`${API}/api/s/${slug}/complete`, {
        method: 'POST',
        headers: { Cookie: ridCookie },
      });
    }
  });

  test('timeline returns data', async () => {
    const timeline = await apiGet(`/api/surveys/${surveyId}/results/timeline?granularity=day`);
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0]).toHaveProperty('period');
    expect(timeline[0]).toHaveProperty('started');
    expect(timeline[0]).toHaveProperty('completed');
  });

  test('dropoff returns data', async () => {
    const dropoff = await apiGet(`/api/surveys/${surveyId}/results/dropoff`);
    expect(Array.isArray(dropoff)).toBe(true);
    expect(dropoff.length).toBeGreaterThan(0);
    expect(dropoff[0]).toHaveProperty('questionId');
    expect(dropoff[0]).toHaveProperty('dropoffRate');
  });

  test('list respondents', async () => {
    const data = await apiGet(`/api/surveys/${surveyId}/results/respondents`);
    expect(data.total).toBeGreaterThanOrEqual(1);
    expect(data.respondents.length).toBeGreaterThanOrEqual(1);
    expect(data.respondents[0]).toHaveProperty('answerCount');
  });

  test('search answers', async () => {
    const data = await apiGet(`/api/surveys/${surveyId}/results/search?q=Test`);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.results[0].answer).toContain('Test');
  });

  test('get single respondent detail', async () => {
    const list = await apiGet(`/api/surveys/${surveyId}/results/respondents`);
    expect(list.respondents.length).toBeGreaterThan(0);
    const rid = list.respondents[0].id;
    const detail = await apiGet(`/api/surveys/${surveyId}/results/respondents/${rid}`);
    expect(detail.id).toBe(rid);
    expect(detail.answers.length).toBeGreaterThan(0);
    expect(detail.answers[0]).toHaveProperty('questionId');
    expect(detail.answers[0]).toHaveProperty('value');
  });

  test('delete respondent', async () => {
    const list = await apiGet(`/api/surveys/${surveyId}/results/respondents`);
    const rid = list.respondents[0].id;
    const res = await apiDelete(`/api/surveys/${surveyId}/results/respondents/${rid}`);
    expect(res.status).toBe(204);
    // Verify deleted
    const afterList = await apiGet(`/api/surveys/${surveyId}/results/respondents`);
    expect(afterList.respondents.find((r: { id: string }) => r.id === rid)).toBeUndefined();
  });
});

// ============================================================
// Survey import
// ============================================================

test.describe('Survey import', () => {
  test('import survey definition', async () => {
    const definition = {
      version: 1,
      title: 'Imported Survey',
      description: 'Imported via E2E test',
      sections: [
        {
          title: 'Imported Section',
          questions: [
            { text: 'Imported Q1', type: 'text', required: true },
            {
              text: 'Imported Q2',
              type: 'radio',
              options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
              ],
            },
          ],
        },
      ],
    };
    const result = await apiPost('/api/surveys/import', definition);
    expect(result.survey.title).toBe('Imported Survey');
    expect(result.sections.length).toBe(1);
    expect(result.questions.length).toBe(2);
    expect(result.questions[0].text).toBe('Imported Q1');
  });
});

// ============================================================
// Survey deletion
// ============================================================

test.describe('Survey deletion', () => {
  test('delete survey removes it', async () => {
    const survey = await apiPost('/api/surveys', { title: 'To Be Deleted' });
    const res = await apiDelete(`/api/surveys/${survey.id}`);
    expect(res.status).toBe(204);
  });
});

// ============================================================
// Respondent reset
// ============================================================

test.describe('Respondent reset', () => {
  const slug = `do-reset-${Date.now()}`;

  test.beforeAll(async () => {
    await createSurvey(slug);
  });

  test('reset clears respondent cookie', async () => {
    // Start a session
    const resumeRes = await fetch(`${API}/api/s/${slug}/resume`);
    const ridCookie = resumeRes.headers.get('set-cookie')?.split(';')[0];
    expect(ridCookie).toBeTruthy();

    // Reset
    const resetRes = await fetch(`${API}/api/s/${slug}/reset`, {
      method: 'POST',
      headers: { Cookie: ridCookie! },
    });
    expect(resetRes.status).toBe(204);
    // The response should have a Set-Cookie that clears the rid cookie
    const clearCookie = resetRes.headers.get('set-cookie');
    expect(clearCookie).toContain('Max-Age=0');
  });
});

// ============================================================
// WebSocket operations (explicit tests)
// ============================================================

test.describe('WebSocket typed operations', () => {
  const slug = `do-ws-ops-${Date.now()}`;
  let surveyId: string;
  let sectionId: string;

  test.beforeAll(async () => {
    const result = await createSurvey(slug);
    surveyId = result.surveyId;
    sectionId = result.sectionId;
  });

  test('WS get-survey returns survey with sections and questions', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(
      async ({ slug }) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(
            `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/s/${slug}/ws?type=editor`,
          );
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'request', requestId: 'r1', op: 'get-survey', data: {} }));
          };
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'response' && msg.requestId === 'r1') {
              ws.close();
              resolve(msg);
            }
          };
          ws.onerror = () => reject(new Error('WS error'));
          setTimeout(() => reject(new Error('timeout')), 10000);
        });
      },
      { slug },
    );
    const msg = result as {
      op: string;
      data: { survey: { title: string }; sections: unknown[]; questions: unknown[] };
    };
    expect(msg.op).toBe('get-survey');
    expect(msg.data.survey.title).toContain('DO Test');
    expect(msg.data.sections.length).toBeGreaterThan(0);
    expect(msg.data.questions.length).toBeGreaterThan(0);
  });

  test('WS create-section and delete-section', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(
      async ({ slug }) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(
            `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/s/${slug}/ws?type=editor`,
          );
          const responses: Record<string, unknown> = {};
          ws.onopen = () => {
            ws.send(
              JSON.stringify({
                type: 'request',
                requestId: 'create',
                op: 'create-section',
                data: { title: 'WS Created Section' },
              }),
            );
          };
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'response') {
              responses[msg.requestId] = msg;
              if (msg.requestId === 'create' && !msg.error) {
                // Now delete it
                ws.send(
                  JSON.stringify({
                    type: 'request',
                    requestId: 'delete',
                    op: 'delete-section',
                    data: { id: (msg.data as { id: string }).id },
                  }),
                );
              }
              if (msg.requestId === 'delete') {
                ws.close();
                resolve(responses);
              }
            }
          };
          ws.onerror = () => reject(new Error('WS error'));
          setTimeout(() => reject(new Error('timeout')), 10000);
        });
      },
      { slug },
    );
    const msgs = result as Record<string, { data: { title?: string }; error?: string }>;
    expect(msgs.create.data.title).toBe('WS Created Section');
    expect(msgs.delete.error).toBeUndefined();
  });

  test('WS get-results returns aggregated data', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(
      async ({ slug }) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(
            `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/s/${slug}/ws?type=viewer`,
          );
          ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'request', requestId: 'r1', op: 'get-results', data: {} }));
          };
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'response' && msg.requestId === 'r1') {
              ws.close();
              resolve(msg);
            }
          };
          ws.onerror = () => reject(new Error('WS error'));
          setTimeout(() => reject(new Error('timeout')), 10000);
        });
      },
      { slug },
    );
    const msg = result as { data: { respondentCounts: { total: number }; results: unknown[] } };
    expect(msg.data.respondentCounts).toHaveProperty('total');
    expect(msg.data.respondentCounts).toHaveProperty('completed');
    expect(Array.isArray(msg.data.results)).toBe(true);
  });

  test('WS receives push events', async ({ page }) => {
    await page.goto('/');
    const pushEvents = await page.evaluate(
      async ({ slug }) => {
        return new Promise((resolve, reject) => {
          const events: unknown[] = [];
          const ws = new WebSocket(
            `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/s/${slug}/ws?type=viewer`,
          );
          ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'push') events.push(msg);
          };
          ws.onerror = () => reject(new Error('WS error'));
          setTimeout(() => {
            ws.close();
            resolve(events);
          }, 4000);
        });
      },
      { slug },
    );
    const events = pushEvents as Array<{ event: string; data: unknown }>;
    expect(events.length).toBeGreaterThan(0);
    const countsEvent = events.find((e) => e.event === 'counts');
    expect(countsEvent).toBeTruthy();
    expect(countsEvent!.data).toHaveProperty('activeViewers');
  });
});
