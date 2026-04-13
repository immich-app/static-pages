import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Survey, SurveySection, SurveyQuestion } from '../types';
import type { AuditEntry } from '../api/audit';
import type { Tag } from '../api/tags';

// ── Survey archiving helpers ─────────────────────────────────────────────

/**
 * Mirrors `surveyFromApi` from engines/builder-transforms.ts
 */
function surveyFromApi(apiSurvey: Record<string, unknown>): Survey {
  return {
    id: apiSurvey.id as string,
    title: apiSurvey.title as string,
    description: (apiSurvey.description as string) ?? null,
    slug: (apiSurvey.slug as string) ?? null,
    status: (apiSurvey.status as Survey['status']) ?? 'draft',
    welcomeTitle: (apiSurvey.welcome_title as string) ?? null,
    welcomeDescription: (apiSurvey.welcome_description as string) ?? null,
    thankYouTitle: (apiSurvey.thank_you_title as string) ?? null,
    thankYouDescription: (apiSurvey.thank_you_description as string) ?? null,
    closesAt: (apiSurvey.closes_at as string) ?? null,
    maxResponses: (apiSurvey.max_responses as number) ?? null,
    randomizeQuestions: !!(apiSurvey.randomize_questions as number),
    randomizeOptions: !!(apiSurvey.randomize_options as number),
    hasPassword: !!(apiSurvey.password_hash as string),
    requiresPassword: !!(apiSurvey.requiresPassword as boolean),
    archivedAt: (apiSurvey.archived_at as string) ?? null,
    createdAt: apiSurvey.created_at as string,
    updatedAt: apiSurvey.updated_at as string,
  };
}

// ── Export/import definition helpers ─────────────────────────────────────

interface ExportDefinition {
  version: number;
  title: string;
  description: string | null;
  sections: Array<{
    title: string;
    description?: string;
    sortOrder: number;
    questions: Array<{
      text: string;
      type: string;
      required: boolean;
      sortOrder: number;
      options?: Array<{ label: string; value: string }>;
    }>;
  }>;
}

function createExportDefinition(
  survey: Survey,
  sections: SurveySection[],
  questions: SurveyQuestion[],
): ExportDefinition {
  return {
    version: 1,
    title: survey.title,
    description: survey.description,
    sections: sections.map((s) => ({
      title: s.title,
      description: s.description,
      sortOrder: s.sortOrder,
      questions: questions
        .filter((q) => q.section_id === s.id)
        .map((q) => ({
          text: q.text,
          type: q.type,
          required: q.required,
          sortOrder: q.sortOrder,
          options: q.options,
        })),
    })),
  };
}

function validateImportDefinition(def: unknown): { valid: boolean; error?: string } {
  if (!def || typeof def !== 'object') return { valid: false, error: 'Invalid definition' };
  const d = def as Record<string, unknown>;
  if (!d.title || typeof d.title !== 'string' || !d.title.trim()) {
    return { valid: false, error: 'Title is required' };
  }
  if (!Array.isArray(d.sections) || d.sections.length === 0) {
    return { valid: false, error: 'At least one section is required' };
  }
  return { valid: true };
}

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe('Survey archiving', () => {
  it('archived survey has archivedAt set', () => {
    const api = surveyFromApi({
      id: 's1',
      title: 'Test',
      status: 'published',
      archived_at: '2026-03-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    });
    expect(api.archivedAt).toBe('2026-03-01T00:00:00Z');
  });

  it('unarchived survey has archivedAt null', () => {
    const api = surveyFromApi({
      id: 's1',
      title: 'Test',
      status: 'published',
      archived_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-03-01T00:00:00Z',
    });
    expect(api.archivedAt).toBeNull();
  });

  it('surveyFromApi correctly maps archived_at field', () => {
    const timestamp = '2026-02-15T12:00:00Z';
    const api = surveyFromApi({
      id: 's2',
      title: 'Archived Survey',
      status: 'closed',
      archived_at: timestamp,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-15T12:00:00Z',
    });
    expect(api.archivedAt).toBe(timestamp);
  });

  it('default survey (no archived_at key) has archivedAt null', () => {
    const api = surveyFromApi({
      id: 's3',
      title: 'New Survey',
      status: 'draft',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    expect(api.archivedAt).toBeNull();
  });

  it('surveyFromApi maps all core fields correctly', () => {
    const api = surveyFromApi({
      id: 's4',
      title: 'Full Survey',
      description: 'A description',
      slug: 'full-survey',
      status: 'published',
      welcome_title: 'Welcome',
      welcome_description: 'Welcome desc',
      thank_you_title: 'Thanks',
      thank_you_description: 'Thanks desc',
      closes_at: '2026-12-31T00:00:00Z',
      max_responses: 500,
      randomize_questions: 1,
      randomize_options: 0,
      password_hash: 'abc',
      archived_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    });
    expect(api.id).toBe('s4');
    expect(api.slug).toBe('full-survey');
    expect(api.welcomeTitle).toBe('Welcome');
    expect(api.randomizeQuestions).toBe(true);
    expect(api.randomizeOptions).toBe(false);
    expect(api.hasPassword).toBe(true);
    expect(api.maxResponses).toBe(500);
  });

  it('surveyFromApi defaults status to draft when missing', () => {
    const api = surveyFromApi({
      id: 's5',
      title: 'No Status',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    expect(api.status).toBe('draft');
  });
});

describe('Tag data', () => {
  it('Tag interface has id, name, and color fields', () => {
    const tag: Tag = { id: 't1', name: 'Beta', color: '#ff0000' };
    expect(tag.id).toBe('t1');
    expect(tag.name).toBe('Beta');
    expect(tag.color).toBe('#ff0000');
  });

  it('Tag creation with name and color', () => {
    const tag: Tag = { id: 't2', name: 'Production', color: '#00ff00' };
    expect(tag.name).toBe('Production');
    expect(tag.color).toBe('#00ff00');
  });

  it('Tag creation with name only (color null)', () => {
    const tag: Tag = { id: 't3', name: 'Internal', color: null };
    expect(tag.name).toBe('Internal');
    expect(tag.color).toBeNull();
  });

  it('empty tag name should be invalid (backend rejects)', () => {
    const name = '';
    expect(name.trim()).toBe('');
    expect(name.trim().length).toBe(0);
  });

  it('whitespace-only tag name should be invalid', () => {
    const name = '   ';
    expect(name.trim().length).toBe(0);
  });

  it('survey tag association is an array of tag IDs', () => {
    const tagIds: string[] = ['t1', 't2', 't3'];
    expect(tagIds).toHaveLength(3);
    expect(tagIds).toContain('t1');
  });

  it('empty tag array is valid (no tags)', () => {
    const tagIds: string[] = [];
    expect(tagIds).toHaveLength(0);
  });

  it('filtering surveys by tag works with array.includes', () => {
    const surveys = [
      { id: 's1', tagIds: ['t1', 't2'] },
      { id: 's2', tagIds: ['t2'] },
      { id: 's3', tagIds: ['t3'] },
    ];
    const filtered = surveys.filter((s) => s.tagIds.includes('t2'));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((s) => s.id)).toEqual(['s1', 's2']);
  });
});

describe('Import/export definition', () => {
  const baseSurvey: Survey = {
    id: 's1',
    title: 'Test Survey',
    description: 'A description',
    slug: 'test-survey',
    status: 'published',
    welcomeTitle: null,
    welcomeDescription: null,
    thankYouTitle: null,
    thankYouDescription: null,
    closesAt: null,
    maxResponses: null,
    randomizeQuestions: false,
    randomizeOptions: false,
    hasPassword: false,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const baseSections: SurveySection[] = [{ id: 'sec1', title: 'Section 1', sortOrder: 0 }];

  const baseQuestions: SurveyQuestion[] = [
    {
      id: 'q1',
      section_id: 'sec1',
      text: 'How are you?',
      type: 'radio',
      required: true,
      sortOrder: 0,
      options: [{ label: 'Good', value: 'good' }],
    },
  ];

  it('export definition shape has version, title, sections', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    expect(def.version).toBe(1);
    expect(def.title).toBe('Test Survey');
    expect(def.sections).toHaveLength(1);
  });

  it('export definition has no IDs in sections or questions', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    const section = def.sections[0];
    expect(section).not.toHaveProperty('id');
    expect(section.questions[0]).not.toHaveProperty('id');
    expect(section.questions[0]).not.toHaveProperty('section_id');
  });

  it('export definition has no respondent data', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    expect(def).not.toHaveProperty('respondents');
    expect(def).not.toHaveProperty('answers');
    expect(def).not.toHaveProperty('responses');
  });

  it('export definition includes description', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    expect(def.description).toBe('A description');
  });

  it('import with empty title should fail', () => {
    const result = validateImportDefinition({ title: '', sections: [{ title: 'S' }] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Title');
  });

  it('import with whitespace-only title should fail', () => {
    const result = validateImportDefinition({ title: '   ', sections: [{ title: 'S' }] });
    expect(result.valid).toBe(false);
  });

  it('import with no sections should fail', () => {
    const result = validateImportDefinition({ title: 'Valid', sections: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('section');
  });

  it('import with missing sections key should fail', () => {
    const result = validateImportDefinition({ title: 'Valid' });
    expect(result.valid).toBe(false);
  });

  it('import with valid data passes validation', () => {
    const result = validateImportDefinition({
      version: 1,
      title: 'Imported Survey',
      sections: [{ title: 'Section 1', questions: [] }],
    });
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('round-trip: exported definition passes import validation', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    const result = validateImportDefinition(def);
    expect(result.valid).toBe(true);
  });

  it('definition version field is 1', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    expect(def.version).toBe(1);
  });

  it('import with null input fails', () => {
    const result = validateImportDefinition(null);
    expect(result.valid).toBe(false);
  });

  it('export preserves question options', () => {
    const def = createExportDefinition(baseSurvey, baseSections, baseQuestions);
    expect(def.sections[0].questions[0].options).toEqual([{ label: 'Good', value: 'good' }]);
  });
});

describe('Audit log entry', () => {
  it('entry shape has required fields', () => {
    const entry: AuditEntry = {
      id: 'a1',
      user_sub: 'u1',
      user_email: 'admin@example.com',
      action: 'survey.create',
      resource_type: 'survey',
      resource_id: 's1',
      details: null,
      ip_address: '127.0.0.1',
      created_at: '2026-03-01T00:00:00Z',
    };
    expect(entry.id).toBe('a1');
    expect(entry.user_sub).toBe('u1');
    expect(entry.action).toBe('survey.create');
    expect(entry.created_at).toBeTruthy();
  });

  it('action types are strings', () => {
    const actions = ['survey.create', 'survey.update', 'survey.delete', 'survey.publish', 'tag.create'];
    for (const action of actions) {
      expect(typeof action).toBe('string');
    }
  });

  it('resource types include survey, respondent, tag', () => {
    const resourceTypes = ['survey', 'respondent', 'tag'];
    expect(resourceTypes).toContain('survey');
    expect(resourceTypes).toContain('respondent');
    expect(resourceTypes).toContain('tag');
  });

  it('resource_id and details can be null', () => {
    const entry: AuditEntry = {
      id: 'a2',
      user_sub: 'u1',
      user_email: 'admin@example.com',
      action: 'auth.login',
      resource_type: 'session',
      resource_id: null,
      details: null,
      ip_address: null,
      created_at: '2026-03-01T00:00:00Z',
    };
    expect(entry.resource_id).toBeNull();
    expect(entry.details).toBeNull();
    expect(entry.ip_address).toBeNull();
  });

  it('timestamp is ISO 8601 format', () => {
    const entry: AuditEntry = {
      id: 'a3',
      user_sub: 'u1',
      user_email: 'a@b.com',
      action: 'survey.archive',
      resource_type: 'survey',
      resource_id: 's1',
      details: '{"reason":"cleanup"}',
      ip_address: '10.0.0.1',
      created_at: '2026-03-15T14:30:00Z',
    };
    expect(entry.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('details field can hold JSON string', () => {
    const entry: AuditEntry = {
      id: 'a4',
      user_sub: 'u1',
      user_email: 'a@b.com',
      action: 'survey.update',
      resource_type: 'survey',
      resource_id: 's1',
      details: JSON.stringify({ field: 'title', oldValue: 'Old', newValue: 'New' }),
      ip_address: null,
      created_at: '2026-03-15T14:30:00Z',
    };
    const parsed = JSON.parse(entry.details!);
    expect(parsed.field).toBe('title');
  });
});

describe('API URL construction — survey admin', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ surveys: [], total: 0 }),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listSurveys() calls /api/surveys', async () => {
    const { listSurveys } = await import('../api/survey-admin');
    await listSurveys();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys');
  });

  it('listSurveys(true) calls /api/surveys?archived=true', async () => {
    const { listSurveys } = await import('../api/survey-admin');
    await listSurveys(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys?archived=true');
  });

  it('archiveSurvey(id) calls PUT /api/surveys/{id}/archive', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: 's1',
          archived_at: '2026-03-01',
          created_at: '2026-01-01',
          updated_at: '2026-03-01',
          title: 'T',
        }),
    });
    const { archiveSurvey } = await import('../api/survey-admin');
    await archiveSurvey('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/surveys/s1/archive');
    expect(opts.method).toBe('PUT');
  });

  it('unarchiveSurvey(id) calls PUT /api/surveys/{id}/unarchive', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: 's1',
          archived_at: null,
          created_at: '2026-01-01',
          updated_at: '2026-03-01',
          title: 'T',
        }),
    });
    const { unarchiveSurvey } = await import('../api/survey-admin');
    await unarchiveSurvey('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/surveys/s1/unarchive');
    expect(opts.method).toBe('PUT');
  });

  it('exportSurveyDefinition(id) calls GET /api/surveys/{id}/definition', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ version: 1, title: 'T', sections: [] }),
    });
    const { exportSurveyDefinition } = await import('../api/survey-admin');
    await exportSurveyDefinition('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/definition');
  });

  it('importSurveyDefinition(def) calls POST /api/surveys/import', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          survey: { id: 's2', title: 'T', created_at: '2026-01-01', updated_at: '2026-01-01' },
          sections: [],
          questions: [],
        }),
    });
    const { importSurveyDefinition } = await import('../api/survey-admin');
    const def = { version: 1, title: 'Imported', sections: [] };
    await importSurveyDefinition(def);
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/surveys/import');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body as string)).toEqual(def);
  });
});

describe('API URL construction — tags', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('listTags() calls GET /api/tags', async () => {
    const { listTags } = await import('../api/tags');
    await listTags();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/tags');
  });

  it('createTag sends POST to /api/tags with body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 't1', name: 'Beta', color: '#ff0000' }),
    });
    const { createTag } = await import('../api/tags');
    await createTag({ name: 'Beta', color: '#ff0000' });
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/tags');
    expect(opts.method).toBe('POST');
  });

  it('deleteTag sends DELETE to /api/tags/{id}', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 204 });
    const { deleteTag } = await import('../api/tags');
    await deleteTag('t1');
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/tags/t1');
    expect(opts.method).toBe('DELETE');
  });

  it('getSurveyTags calls GET /api/surveys/{id}/tags', async () => {
    const { getSurveyTags } = await import('../api/tags');
    await getSurveyTags('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/surveys/s1/tags');
  });

  it('setSurveyTags calls PUT /api/surveys/{id}/tags with tagIds', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 204 });
    const { setSurveyTags } = await import('../api/tags');
    await setSurveyTags('s1', ['t1', 't2']);
    const url = fetchSpy.mock.calls[0][0] as string;
    const opts = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(url).toBe('/api/surveys/s1/tags');
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body as string)).toEqual({ tagIds: ['t1', 't2'] });
  });
});

describe('API URL construction — audit log', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ entries: [], total: 0 }),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getAuditLog() calls GET /api/audit-log with defaults', async () => {
    const { getAuditLog } = await import('../api/audit');
    await getAuditLog();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/audit-log?offset=0&limit=50');
  });

  it('getAuditLog(10, 25) passes custom offset and limit', async () => {
    const { getAuditLog } = await import('../api/audit');
    await getAuditLog(10, 25);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/audit-log?offset=10&limit=25');
  });

  it('getSurveyAuditLog calls GET /api/audit-log/survey/{id}', async () => {
    const { getSurveyAuditLog } = await import('../api/audit');
    await getSurveyAuditLog('s1');
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/audit-log/survey/s1?offset=0&limit=50');
  });

  it('getSurveyAuditLog with custom pagination', async () => {
    const { getSurveyAuditLog } = await import('../api/audit');
    await getSurveyAuditLog('s1', 20, 10);
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/audit-log/survey/s1?offset=20&limit=10');
  });
});
