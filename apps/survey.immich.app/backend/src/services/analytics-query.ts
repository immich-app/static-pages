import type { AnalyticsQueryConfig } from '../config';

export interface LiveCounts {
  activeViewers: number;
  activeRespondents: number;
}

export async function queryLiveCounts(config: AnalyticsQueryConfig, surveyId: string): Promise<LiveCounts> {
  const sql = `
    SELECT blob2 AS type, COUNT(DISTINCT blob1) AS unique_count
    FROM ${config.dataset}
    WHERE index1 = '${surveyId.replace(/'/g, "''")}'
      AND timestamp >= NOW() - INTERVAL '60' SECOND
    GROUP BY blob2
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: sql,
    },
  );

  if (!response.ok) {
    console.error('Analytics Engine query failed:', response.status, await response.text());
    return { activeViewers: 0, activeRespondents: 0 };
  }

  const text = await response.text();
  const rows = parseAnalyticsResponse(text);

  let activeViewers = 0;
  let activeRespondents = 0;

  for (const row of rows) {
    if (row.type === 'viewer') {
      activeViewers = row.unique_count;
    } else if (row.type === 'respondent') {
      activeRespondents = row.unique_count;
    }
  }

  return { activeViewers, activeRespondents };
}

function parseAnalyticsResponse(text: string): Array<{ type: string; unique_count: number }> {
  // Analytics Engine SQL API returns JSON: { meta: [...], data: [...], rows: N }
  // Values like unique_count come back as strings (e.g. "1")
  try {
    const parsed = JSON.parse(text) as {
      data?: Array<{ type: string; unique_count: string | number }>;
    };
    if (!parsed.data || !Array.isArray(parsed.data)) return [];
    return parsed.data.map((row) => ({
      type: row.type,
      unique_count: Number(row.unique_count),
    }));
  } catch {
    return [];
  }
}
