<script lang="ts">
  import type { SurveyQuestion } from '$lib/types';
  import HorizontalBar from './HorizontalBar.svelte';
  import StatStrip from './StatStrip.svelte';
  import LowSampleNotice from './LowSampleNotice.svelte';
  import { computeCheckboxStats, LOW_SAMPLE_THRESHOLD, type AnswerData } from './analytics-utils';

  interface Props {
    question: SurveyQuestion;
    answers: AnswerData[];
  }

  let { question, answers }: Props = $props();

  const isCheckbox = $derived(question.type === 'checkbox');

  // For checkbox: one answer row per respondent combination — split into per-option counts.
  const checkbox = $derived(isCheckbox ? computeCheckboxStats(answers) : null);

  // For radio/dropdown: one row per selected option.
  const radioTotal = $derived(answers.reduce((sum, a) => sum + a.count, 0));

  // Map option value → option label (defensive: a missing option still displays its raw value)
  const optionLabels = $derived.by(() => {
    const map: Record<string, string> = {};
    for (const opt of question.options ?? []) map[opt.value] = opt.label;
    return map;
  });

  function displayLabel(value: string, otherText?: string | null): string {
    const base = optionLabels[value] ?? value;
    return otherText ? `${base}: ${otherText}` : base;
  }

  const rows = $derived.by(() => {
    if (isCheckbox && checkbox) {
      return checkbox.perOption.map((o, i) => ({
        label: optionLabels[o.value] ?? o.value,
        value: o.count,
        percent: o.percent,
        highlight: i === 0 && o.count > 0,
      }));
    }

    // radio / dropdown
    return [...answers]
      .sort((a, b) => b.count - a.count)
      .map((a, i) => ({
        label: displayLabel(a.value, a.otherText),
        value: a.count,
        percent: radioTotal > 0 ? (a.count / radioTotal) * 100 : 0,
        highlight: i === 0 && a.count > 0,
      }));
  });

  const totalRespondentCount = $derived(isCheckbox && checkbox ? checkbox.total : radioTotal);
  const topRow = $derived(rows[0]);

  interface StatEntry {
    label: string;
    value: string;
    tone?: 'default' | 'positive' | 'negative' | 'warning';
    hint?: string;
  }

  const stats = $derived.by<StatEntry[]>(() => {
    const base: StatEntry[] = [{ label: 'Responses', value: String(totalRespondentCount) }];
    if (topRow && topRow.value > 0) {
      base.push({
        label: isCheckbox ? 'Most selected' : 'Most common',
        value: topRow.label,
        tone: 'positive',
      });
    }
    if (isCheckbox && checkbox) {
      base.push({
        label: 'Avg selections',
        value: checkbox.avgSelections.toFixed(1),
        hint: 'Average number of options each respondent selected',
      });
    }
    return base;
  });
</script>

<div class="space-y-4">
  <StatStrip {stats} />

  {#if totalRespondentCount < LOW_SAMPLE_THRESHOLD && totalRespondentCount > 0}
    <LowSampleNotice count={totalRespondentCount} threshold={LOW_SAMPLE_THRESHOLD} metricName="distribution" />
  {/if}

  {#if rows.length > 0}
    <HorizontalBar
      {rows}
      countLabel={isCheckbox ? 'respondents' : 'responses'}
    />
    {#if isCheckbox}
      <p class="text-xs text-gray-500">
        Percentages are of {totalRespondentCount}
        {totalRespondentCount === 1 ? 'respondent' : 'respondents'} who answered this question.
      </p>
    {/if}
  {:else}
    <p class="text-sm text-gray-500">No responses yet.</p>
  {/if}
</div>
