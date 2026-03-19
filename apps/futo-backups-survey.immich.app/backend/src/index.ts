import { AutoRouter, cors, IRequest } from 'itty-router';
import { getRespondentId, setRespondentCookie, deleteRespondentCookie } from './cookie';
import { questions } from './survey-definition';

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, [Env, ExecutionContext]>({
  before: [preflight],
  finally: [corsify],
});

router.post('/api/answers', async (request, env) => {
  const db = env.DB;
  const { questionId, value, otherText } = (await request.json()) as {
    questionId: string;
    value: string;
    otherText?: string;
  };

  const ip =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('x-forwarded-for') ??
    'unknown';

  let respondentId = getRespondentId(request);
  const headers = new Headers();

  if (!respondentId) {
    respondentId = crypto.randomUUID();
    setRespondentCookie(headers, respondentId);
  }

  await db
    .prepare(
      `INSERT INTO respondents (id, ip_address, created_at) VALUES (?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET ip_address = excluded.ip_address`,
    )
    .bind(respondentId, ip, new Date().toISOString())
    .run();

  await db
    .prepare(
      `INSERT INTO answers (respondent_id, question_id, answer, other_text, answered_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (respondent_id, question_id)
       DO UPDATE SET answer = excluded.answer, other_text = excluded.other_text, answered_at = excluded.answered_at`,
    )
    .bind(respondentId, questionId, value, otherText ?? null, new Date().toISOString())
    .run();

  return new Response(null, { status: 204, headers });
});

router.get('/api/resume', async (request, env) => {
  const db = env.DB;
  let respondentId = getRespondentId(request);
  const headers = new Headers();

  if (!respondentId) {
    respondentId = crypto.randomUUID();
    const ip =
      request.headers.get('CF-Connecting-IP') ??
      request.headers.get('x-forwarded-for') ??
      'unknown';
    await db
      .prepare('INSERT INTO respondents (id, ip_address, created_at) VALUES (?, ?, ?)')
      .bind(respondentId, ip, new Date().toISOString())
      .run();
    setRespondentCookie(headers, respondentId);
    return Response.json({ answers: {}, nextQuestionIndex: 0 }, { headers });
  }

  const respondent = await db
    .prepare('SELECT id, is_complete FROM respondents WHERE id = ?')
    .bind(respondentId)
    .first<{ id: string; is_complete: number }>();

  if (!respondent) {
    return Response.json({ answers: {}, nextQuestionIndex: 0 }, { headers });
  }

  if (respondent.is_complete) {
    return Response.json({ isComplete: true }, { headers });
  }

  const rows = await db
    .prepare('SELECT question_id, answer, other_text FROM answers WHERE respondent_id = ?')
    .bind(respondentId)
    .all<{ question_id: string; answer: string; other_text: string | null }>();

  const answers: Record<string, { value: string; otherText?: string }> = {};
  for (const row of rows.results) {
    answers[row.question_id] = {
      value: row.answer,
      ...(row.other_text ? { otherText: row.other_text } : {}),
    };
  }

  let nextQuestionIndex = questions.length;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    if (q.conditional?.showIf.condition === 'skipped') {
      const depId = q.conditional.showIf.questionId;
      if (answers[depId]) {
        continue;
      }
    }

    if (!answers[q.id]) {
      nextQuestionIndex = i;
      break;
    }
  }

  return Response.json({ answers, nextQuestionIndex }, { headers });
});

router.post('/api/complete', async (request, env) => {
  const db = env.DB;
  const respondentId = getRespondentId(request);

  if (!respondentId) {
    return new Response('No respondent cookie', { status: 400 });
  }

  await db
    .prepare('UPDATE respondents SET is_complete = 1, completed_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), respondentId)
    .run();

  return new Response(null, { status: 204 });
});

router.post('/api/reset', async (request) => {
  const headers = new Headers();
  deleteRespondentCookie(headers);
  return new Response(null, { status: 204, headers });
});

export default router;
