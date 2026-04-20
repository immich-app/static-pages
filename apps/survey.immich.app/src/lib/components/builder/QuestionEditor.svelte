<script lang="ts">
  import { Input, Textarea } from '@immich/ui';
  import { Icon } from '@immich/ui';
  import {
    mdiDelete,
    mdiArrowUp,
    mdiArrowDown,
    mdiContentCopy,
    mdiRadioboxMarked,
    mdiCheckboxMarked,
    mdiFormTextbox,
    mdiTextLong,
    mdiEmailOutline,
    mdiAsterisk,
    mdiChevronDown,
    mdiStar,
    mdiNumeric,
    mdiPound,
    mdiMenuDown,
    mdiScaleBalance,
    mdiDragVertical,
  } from '@mdi/js';
  import type { QuestionType } from '$lib/types';
  import type { BuilderQuestion } from '$lib/engines/builder-engine.svelte';
  import OptionListEditor from './OptionListEditor.svelte';
  import { tick } from 'svelte';

  interface Props {
    question: BuilderQuestion;
    index: number;
    total: number;
    expanded: boolean;
    allQuestions?: BuilderQuestion[];
    dragHandle?: boolean;
    onChange: (question: BuilderQuestion) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMove: (direction: 'up' | 'down') => void;
    onToggle: () => void;
  }

  let {
    question,
    index,
    total,
    expanded,
    allQuestions = [],
    dragHandle = false,
    onChange,
    onDelete,
    onDuplicate,
    onMove,
    onToggle,
  }: Props = $props();

  let confirmingDelete = $state(false);
  let questionTextInput: HTMLElement | undefined = $state();

  const questionTypes: { value: QuestionType; label: string; icon: string }[] = [
    { value: 'radio', label: 'Single Choice', icon: mdiRadioboxMarked },
    { value: 'checkbox', label: 'Multiple Choice', icon: mdiCheckboxMarked },
    { value: 'text', label: 'Short Text', icon: mdiFormTextbox },
    { value: 'textarea', label: 'Long Text', icon: mdiTextLong },
    { value: 'email', label: 'Email', icon: mdiEmailOutline },
    { value: 'rating', label: 'Rating', icon: mdiStar },
    { value: 'nps', label: 'NPS', icon: mdiNumeric },
    { value: 'number', label: 'Number', icon: mdiPound },
    { value: 'dropdown', label: 'Dropdown', icon: mdiMenuDown },
    { value: 'likert', label: 'Likert', icon: mdiScaleBalance },
  ];

  const currentTypeInfo = $derived(questionTypes.find((t) => t.value === question.type) ?? questionTypes[0]);
  const showOptions = $derived(['radio', 'checkbox', 'dropdown'].includes(question.type));

  let showLogic = $state(false);
  let showValidation = $state(false);
  const hasValidationOptions = $derived(['text', 'textarea', 'email', 'number', 'checkbox'].includes(question.type));
  const precedingQuestions = $derived(allQuestions.filter((_, i) => i < index));
  type LogicConditionType = 'skipped' | 'equals' | 'notEquals' | 'anyOf';
  const initialLogicType: LogicConditionType = (() => {
    const saved = question.config?.skipConditionType;
    if (saved === 'skipped' || saved === 'equals' || saved === 'notEquals' || saved === 'anyOf') return saved;
    // Back-compat: infer from which value field is populated if an older
    // survey was saved before skipConditionType was persisted.
    if (question.config?.skipConditionValues) return 'anyOf';
    return 'equals';
  })();
  let logicConditionType = $state<LogicConditionType>(initialLogicType);
  const showLogicValueInput = $derived(['equals', 'notEquals'].includes(logicConditionType));
  const showLogicValuesInput = $derived(logicConditionType === 'anyOf');

  function updateField<K extends keyof BuilderQuestion>(field: K, value: BuilderQuestion[K]) {
    onChange({ ...question, [field]: value });
  }

  function handleTypeChange(newType: QuestionType) {
    const updated = { ...question, type: newType };
    if (['radio', 'checkbox', 'dropdown'].includes(newType) && updated.options.length < 2) {
      updated.options = [
        { label: 'Option 1', value: 'Option 1' },
        { label: 'Option 2', value: 'Option 2' },
      ];
    }
    if (!['radio', 'checkbox', 'dropdown'].includes(newType)) {
      updated.hasOther = false;
    }
    switch (newType) {
      case 'rating':
        updated.config = { scaleMax: 5 };
        updated.options = [];
        break;
      case 'nps':
        updated.config = { scaleMax: 10 };
        updated.options = [];
        break;
      case 'number':
        updated.config = { min: 0, max: 100 };
        updated.options = [];
        break;
      case 'likert':
        updated.config = {};
        updated.options = [];
        break;
      case 'dropdown':
        // keep options
        break;
      default:
        break;
    }
    onChange(updated);
  }

  export function focusText() {
    tick().then(() => questionTextInput?.focus());
  }
</script>

<div
  class="group rounded-lg border transition-all duration-200
    {expanded
    ? 'border-immich-primary/30 bg-immich-primary-5 shadow-sm'
    : 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'}"
>
  <!-- Collapsed header (always visible) -->
  <div class="flex w-full items-center gap-1 px-4 py-3">
    {#if dragHandle}
      <div
        class="shrink-0 cursor-grab text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <Icon icon={mdiDragVertical} size="16" />
      </div>
    {/if}
    <button class="flex min-w-0 flex-1 items-center gap-3 text-left" onclick={onToggle}>
      <Icon icon={currentTypeInfo.icon} size="16" class="shrink-0 text-gray-400" />
      <span class="min-w-0 flex-1 truncate text-sm {question.text ? '' : 'text-gray-500 italic'}">
        {question.text || 'Untitled question'}
      </span>
      {#if question.required}
        <span
          class="bg-immich-primary-10 text-immich-primary shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase"
        >
          Required
        </span>
      {/if}
      <div class="flex shrink-0 items-center gap-0.5">
        <span class="inline-flex items-center transition-transform duration-200 {expanded ? 'rotate-180' : ''}">
          <Icon icon={mdiChevronDown} size="18" class="text-gray-500" />
        </span>
      </div>
    </button>
  </div>

  <!-- Expanded editor -->
  {#if expanded}
    <div class="border-t border-gray-200 px-4 pt-4 pb-4 dark:border-gray-700/60">
      <!-- Action bar -->
      <div class="mb-4 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-500">Question {index + 1}</span>
        <div class="flex items-center gap-0.5">
          <button
            class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
            disabled={index === 0}
            onclick={() => onMove('up')}
            title="Move up"
          >
            <Icon icon={mdiArrowUp} size="16" />
          </button>
          <button
            class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
            disabled={index === total - 1}
            onclick={() => onMove('down')}
            title="Move down"
          >
            <Icon icon={mdiArrowDown} size="16" />
          </button>
          <button
            class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
            onclick={onDuplicate}
            title="Duplicate"
          >
            <Icon icon={mdiContentCopy} size="16" />
          </button>
          {#if confirmingDelete}
            <div class="ml-2 flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1">
              <span class="text-xs text-red-400">Delete?</span>
              <button
                class="text-xs font-medium text-red-400 hover:text-red-300"
                onclick={() => {
                  confirmingDelete = false;
                  onDelete();
                }}>Yes</button
              >
              <button class="text-xs text-gray-400 hover:text-gray-300" onclick={() => (confirmingDelete = false)}
                >No</button
              >
            </div>
          {:else}
            <button
              class="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
              onclick={() => (question.text ? (confirmingDelete = true) : onDelete())}
              title="Delete"
            >
              <Icon icon={mdiDelete} size="16" />
            </button>
          {/if}
        </div>
      </div>

      <div class="space-y-4">
        <!-- Question text -->
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Question</label>
          <div bind:this={questionTextInput}>
            <Input
              value={question.text}
              placeholder="What would you like to ask?"
              oninput={(e) => updateField('text', (e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase"
            >Description <span class="tracking-normal text-gray-500 normal-case">(optional)</span></label
          >
          <Textarea
            value={question.description}
            rows={2}
            placeholder="Additional context..."
            oninput={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
          />
        </div>

        <!-- Type picker -->
        <div>
          <label class="mb-2 block text-xs font-medium tracking-wider text-gray-500 uppercase">Type</label>
          <div class="flex flex-wrap gap-1.5">
            {#each questionTypes as qt (qt.value)}
              <button
                class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all
                  {question.type === qt.value
                  ? 'border-immich-primary bg-immich-primary-10 text-immich-primary'
                  : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-300 dark:border-gray-700'}"
                onclick={() => handleTypeChange(qt.value)}
              >
                <Icon icon={qt.icon} size="15" />
                {qt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Settings row -->
        <div class="flex items-center gap-5">
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={question.required}
              onchange={(e) => updateField('required', (e.target as HTMLInputElement).checked)}
              class="accent-immich-primary"
            />
            <Icon icon={mdiAsterisk} size="14" class="text-gray-500" />
            Required
          </label>

          {#if showOptions}
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.hasOther}
                onchange={(e) => updateField('hasOther', (e.target as HTMLInputElement).checked)}
                class="accent-immich-primary"
              />
              Allow "Other" response
            </label>
          {/if}
        </div>

        <!-- Options (radio/checkbox) -->
        {#if showOptions}
          <OptionListEditor options={question.options} onChange={(opts) => updateField('options', opts)} />
        {/if}

        <!-- Textarea max length -->
        {#if question.type === 'textarea'}
          <div class="max-w-xs">
            <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Max length</label>
            <Input
              type="number"
              value={String(question.maxLength ?? 5000)}
              oninput={(e) => updateField('maxLength', Number((e.target as HTMLInputElement).value) || null)}
            />
          </div>
        {/if}

        <!-- Placeholder -->
        {#if ['text', 'email', 'textarea'].includes(question.type)}
          <div>
            <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Placeholder</label>
            <Input
              value={question.placeholder}
              placeholder="Placeholder text..."
              oninput={(e) => updateField('placeholder', (e.target as HTMLInputElement).value)}
            />
          </div>
        {/if}

        <!-- Rating config -->
        {#if question.type === 'rating'}
          <div class="space-y-3">
            <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Rating scale</label>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="rating-scale-{question.id || index}"
                  checked={question.config.scaleMax === 5}
                  onchange={() => updateField('config', { ...question.config, scaleMax: 5 })}
                  class="accent-immich-primary"
                />
                1-5
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="rating-scale-{question.id || index}"
                  checked={question.config.scaleMax === 10}
                  onchange={() => updateField('config', { ...question.config, scaleMax: 10 })}
                  class="accent-immich-primary"
                />
                1-10
              </label>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Low label</label>
                <Input
                  value={String(question.config.lowLabel ?? '')}
                  placeholder="e.g., Poor"
                  oninput={(e) =>
                    updateField('config', { ...question.config, lowLabel: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">High label</label
                >
                <Input
                  value={String(question.config.highLabel ?? '')}
                  placeholder="e.g., Excellent"
                  oninput={(e) =>
                    updateField('config', { ...question.config, highLabel: (e.target as HTMLInputElement).value })}
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- NPS config -->
        {#if question.type === 'nps'}
          <div class="rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-500 dark:bg-gray-800">
            0-10 scale with Detractor/Passive/Promoter segmentation
          </div>
        {/if}

        <!-- Number config -->
        {#if question.type === 'number'}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Min</label>
              <Input
                type="number"
                value={String(question.config.min ?? 0)}
                oninput={(e) =>
                  updateField('config', { ...question.config, min: Number((e.target as HTMLInputElement).value) })}
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Max</label>
              <Input
                type="number"
                value={String(question.config.max ?? 100)}
                oninput={(e) =>
                  updateField('config', { ...question.config, max: Number((e.target as HTMLInputElement).value) })}
              />
            </div>
          </div>
        {/if}

        <!-- Likert config -->
        {#if question.type === 'likert'}
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Low label</label>
              <Input
                value={String(question.config.lowLabel ?? '')}
                placeholder="Strongly Disagree"
                oninput={(e) =>
                  updateField('config', { ...question.config, lowLabel: (e.target as HTMLInputElement).value })}
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">High label</label>
              <Input
                value={String(question.config.highLabel ?? '')}
                placeholder="Strongly Agree"
                oninput={(e) =>
                  updateField('config', { ...question.config, highLabel: (e.target as HTMLInputElement).value })}
              />
            </div>
          </div>
        {/if}

        <!-- Validation + Logic — collapsible sections side by side -->
        <div class="flex gap-4 border-t border-gray-200 pt-4 dark:border-gray-700/60">
          <button
            class="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase"
            onclick={() => (showLogic = !showLogic)}
          >
            <span class="inline-flex transition-transform duration-200 {showLogic ? 'rotate-180' : ''}">
              <Icon icon={mdiChevronDown} size="14" />
            </span>
            Skip Logic
          </button>
          {#if hasValidationOptions}
            <button
              class="flex items-center gap-2 text-xs font-medium tracking-wider text-gray-500 uppercase"
              onclick={() => (showValidation = !showValidation)}
            >
              <span class="inline-flex transition-transform duration-200 {showValidation ? 'rotate-180' : ''}">
                <Icon icon={mdiChevronDown} size="14" />
              </span>
              Validation
            </button>
          {/if}
        </div>

        {#if showLogic}
          <div class="space-y-3">
            {#if precedingQuestions.length === 0}
              <p class="text-xs text-gray-500 italic">No preceding questions available for skip logic.</p>
            {:else}
              <div>
                <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase"
                  >Source question</label
                >
                <select
                  class="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
                  onchange={(e) =>
                    updateField('config', {
                      ...question.config,
                      skipSourceQuestion: (e.target as HTMLSelectElement).value,
                    })}
                >
                  <option value="">Select a question...</option>
                  {#each precedingQuestions as pq, pIndex (pq.id || pIndex)}
                    <option
                      value={pq.id || String(pIndex)}
                      selected={question.config.skipSourceQuestion === (pq.id || String(pIndex))}
                    >
                      Q{pIndex + 1}: {pq.text || 'Untitled'}
                    </option>
                  {/each}
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Condition</label>
                <select
                  class="w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
                  value={logicConditionType}
                  onchange={(e) => {
                    logicConditionType = (e.target as HTMLSelectElement).value as LogicConditionType;
                    updateField('config', { ...question.config, skipConditionType: logicConditionType });
                  }}
                >
                  <option value="skipped">Show if skipped</option>
                  <option value="equals">Show if equals</option>
                  <option value="notEquals">Show if not equals</option>
                  <option value="anyOf">Show if any of</option>
                </select>
              </div>

              {#if showLogicValueInput}
                <div>
                  <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Value</label>
                  <Input
                    value={String(question.config.skipConditionValue ?? '')}
                    placeholder="Expected value..."
                    oninput={(e) =>
                      updateField('config', {
                        ...question.config,
                        skipConditionValue: (e.target as HTMLInputElement).value,
                      })}
                  />
                </div>
              {/if}

              {#if showLogicValuesInput}
                <div>
                  <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Values <span class="tracking-normal text-gray-500 normal-case">(comma-separated)</span>
                  </label>
                  <Input
                    value={String(question.config.skipConditionValues ?? '')}
                    placeholder="value1, value2, value3"
                    oninput={(e) =>
                      updateField('config', {
                        ...question.config,
                        skipConditionValues: (e.target as HTMLInputElement).value,
                      })}
                  />
                </div>
              {/if}
            {/if}
          </div>
        {/if}

        {#if showValidation && hasValidationOptions}
          <div class="space-y-3">
            {#if question.type === 'text' || question.type === 'textarea'}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Min length</label>
                  <Input
                    type="number"
                    value={String(question.config.minLength ?? '')}
                    placeholder="No minimum"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, minLength: v > 0 ? v : undefined });
                    }}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Min words</label>
                  <Input
                    type="number"
                    value={String(question.config.minWords ?? '')}
                    placeholder="No minimum"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, minWords: v > 0 ? v : undefined });
                    }}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Max words</label>
                  <Input
                    type="number"
                    value={String(question.config.maxWords ?? '')}
                    placeholder="No maximum"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, maxWords: v > 0 ? v : undefined });
                    }}
                  />
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs text-gray-500">Pattern (regex)</label>
                <Input
                  value={String(question.config.pattern ?? '')}
                  placeholder="e.g. ^\d{3}-\d{4}$"
                  oninput={(e) =>
                    updateField('config', {
                      ...question.config,
                      pattern: (e.target as HTMLInputElement).value || undefined,
                    })}
                />
              </div>
              {#if question.config.pattern}
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Pattern error message</label>
                  <Input
                    value={String(question.config.patternError ?? '')}
                    placeholder="Answer does not match the required format"
                    oninput={(e) =>
                      updateField('config', {
                        ...question.config,
                        patternError: (e.target as HTMLInputElement).value || undefined,
                      })}
                  />
                </div>
              {/if}
            {/if}

            {#if question.type === 'email'}
              <div>
                <label class="mb-1 block text-xs text-gray-500"
                  >Allowed domains (comma-separated, leave empty for any)</label
                >
                <Input
                  value={((question.config.allowedDomains as string[] | undefined) ?? []).join(', ')}
                  placeholder="e.g. company.com, corp.net"
                  oninput={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    const domains = raw
                      .split(',')
                      .map((d) => d.trim())
                      .filter(Boolean);
                    updateField('config', {
                      ...question.config,
                      allowedDomains: domains.length > 0 ? domains : undefined,
                    });
                  }}
                />
              </div>
            {/if}

            {#if question.type === 'number'}
              <div class="flex flex-wrap items-center gap-4">
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!question.config.integerOnly}
                    onchange={(e) =>
                      updateField('config', {
                        ...question.config,
                        integerOnly: (e.target as HTMLInputElement).checked || undefined,
                      })}
                    class="rounded"
                  />
                  Whole numbers only
                </label>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500">Step</label>
                  <Input
                    type="number"
                    value={String(question.config.step ?? '')}
                    placeholder="Any"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, step: v > 0 ? v : undefined });
                    }}
                  />
                </div>
              </div>
            {/if}

            {#if question.type === 'checkbox'}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Min selections</label>
                  <Input
                    type="number"
                    value={String(question.config.minSelections ?? '')}
                    placeholder="No minimum"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, minSelections: v > 0 ? v : undefined });
                    }}
                  />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Max selections</label>
                  <Input
                    type="number"
                    value={String(question.config.maxSelections ?? '')}
                    placeholder="No maximum"
                    oninput={(e) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      updateField('config', { ...question.config, maxSelections: v > 0 ? v : undefined });
                    }}
                  />
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
