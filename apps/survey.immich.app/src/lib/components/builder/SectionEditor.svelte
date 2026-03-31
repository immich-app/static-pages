<script lang="ts">
  import { Input } from '@immich/ui';
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
    mdiStar,
    mdiNumeric,
    mdiPound,
    mdiMenuDown,
    mdiScaleBalance,
    mdiDragVertical,
    mdiBookmarkOutline,
  } from '@mdi/js';
  import { dndzone } from 'svelte-dnd-action';
  import type { QuestionType } from '$lib/types';
  import type { BuilderSection, BuilderQuestion } from '$lib/engines/builder-engine.svelte';
  import { createQuestionOfType, duplicateQuestion, moveItem } from '$lib/engines/builder-engine.svelte';
  import { questionTemplates, getTemplatesByCategory } from '$lib/engines/question-templates';
  import QuestionEditor from './QuestionEditor.svelte';
  import { tick } from 'svelte';

  interface Props {
    section: BuilderSection;
    index: number;
    total: number;
    onChange: (section: BuilderSection) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onMove: (direction: 'up' | 'down') => void;
  }

  let { section, index, total, onChange, onDelete, onDuplicate, onMove }: Props = $props();

  let expandedQuestionIndex = $state<number | null>(null);
  let confirmingDelete = $state(false);
  let showTemplates = $state(false);
  let questionEditorRefs: (QuestionEditor | undefined)[] = [];

  const addQuestionTypes: { type: QuestionType; label: string; icon: string }[] = [
    { type: 'radio', label: 'Single Choice', icon: mdiRadioboxMarked },
    { type: 'checkbox', label: 'Multiple Choice', icon: mdiCheckboxMarked },
    { type: 'text', label: 'Short Text', icon: mdiFormTextbox },
    { type: 'textarea', label: 'Long Text', icon: mdiTextLong },
    { type: 'email', label: 'Email', icon: mdiEmailOutline },
    { type: 'rating', label: 'Rating', icon: mdiStar },
    { type: 'nps', label: 'NPS', icon: mdiNumeric },
    { type: 'number', label: 'Number', icon: mdiPound },
    { type: 'dropdown', label: 'Dropdown', icon: mdiMenuDown },
    { type: 'likert', label: 'Likert', icon: mdiScaleBalance },
  ];

  const templatesByCategory = getTemplatesByCategory();

  function updateField<K extends keyof BuilderSection>(field: K, value: BuilderSection[K]) {
    onChange({ ...section, [field]: value });
  }

  function addQuestion(type: QuestionType) {
    const newQ = createQuestionOfType(type, section.questions.length);
    const newIndex = section.questions.length;
    onChange({ ...section, questions: [...section.questions, newQ] });
    expandedQuestionIndex = newIndex;
    tick().then(() => {
      questionEditorRefs[newIndex]?.focusText();
      const el = document.querySelector(`[data-question-index="${index}-${newIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function addFromTemplate(templateId: string) {
    const template = questionTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const newQ: BuilderQuestion = {
      ...template.question,
      id: '',
      sortOrder: section.questions.length,
    };
    const newIndex = section.questions.length;
    onChange({ ...section, questions: [...section.questions, newQ] });
    expandedQuestionIndex = newIndex;
    showTemplates = false;
    tick().then(() => {
      questionEditorRefs[newIndex]?.focusText();
      const el = document.querySelector(`[data-question-index="${index}-${newIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function handleDuplicateQuestion(qIndex: number) {
    const original = section.questions[qIndex];
    const copy = duplicateQuestion(original, section.questions.length);
    const updated = [...section.questions];
    updated.splice(qIndex + 1, 0, copy);
    onChange({ ...section, questions: updated });
    expandedQuestionIndex = qIndex + 1;
  }

  function updateQuestion(qIndex: number, question: BuilderQuestion) {
    const updated = [...section.questions];
    updated[qIndex] = question;
    onChange({ ...section, questions: updated });
  }

  function deleteQuestion(qIndex: number) {
    onChange({ ...section, questions: section.questions.filter((_, i) => i !== qIndex) });
    if (expandedQuestionIndex === qIndex) expandedQuestionIndex = null;
    else if (expandedQuestionIndex !== null && expandedQuestionIndex > qIndex) expandedQuestionIndex--;
  }

  function moveQuestion(qIndex: number, direction: 'up' | 'down') {
    const newQuestions = moveItem(section.questions, qIndex, direction);
    onChange({ ...section, questions: newQuestions });
    if (expandedQuestionIndex === qIndex) {
      expandedQuestionIndex = direction === 'up' ? qIndex - 1 : qIndex + 1;
    }
  }

  function handleDeleteSection() {
    if (section.questions.length > 0) {
      confirmingDelete = true;
    } else {
      onDelete();
    }
  }

  // DnD for questions
  const dndQuestions = $derived(
    section.questions.map((q, i) => ({
      ...q,
      id: q.id || `new-q-${index}-${i}`,
    })),
  );

  function handleQuestionDndConsider(e: CustomEvent<{ items: BuilderQuestion[] }>) {
    onChange({ ...section, questions: e.detail.items });
  }

  function handleQuestionDndFinalize(e: CustomEvent<{ items: BuilderQuestion[] }>) {
    const reordered = e.detail.items.map((q, i) => ({ ...q, sortOrder: i }));
    onChange({ ...section, questions: reordered });
  }
</script>

<div class="rounded-xl border border-gray-300 dark:border-gray-600">
  <!-- Section header -->
  <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700/60">
    <div class="flex items-center gap-3">
      <div class="cursor-grab text-gray-500 hover:text-gray-300 active:cursor-grabbing" title="Drag to reorder">
        <Icon icon={mdiDragVertical} size="18" />
      </div>
      <span class="text-sm font-semibold text-gray-400">Section {index + 1}</span>
      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
        {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
      </span>
    </div>
    <div class="flex items-center gap-0.5">
      <button
        class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
        disabled={index === 0}
        onclick={() => onMove('up')}
      >
        <Icon icon={mdiArrowUp} size="16" />
      </button>
      <button
        class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
        disabled={index === total - 1}
        onclick={() => onMove('down')}
      >
        <Icon icon={mdiArrowDown} size="16" />
      </button>
      <button
        class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        onclick={onDuplicate}
        title="Duplicate section"
      >
        <Icon icon={mdiContentCopy} size="16" />
      </button>
      {#if confirmingDelete}
        <div class="ml-2 flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1.5">
          <span class="text-xs text-red-400"
            >Delete section & {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}?</span
          >
          <button
            class="text-xs font-medium text-red-400 hover:text-red-300"
            onclick={() => {
              confirmingDelete = false;
              onDelete();
            }}>Yes</button
          >
          <button class="text-xs text-gray-400 hover:text-gray-300" onclick={() => (confirmingDelete = false)}
            >Cancel</button
          >
        </div>
      {:else}
        <button
          class="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
          onclick={handleDeleteSection}
        >
          <Icon icon={mdiDelete} size="16" />
        </button>
      {/if}
    </div>
  </div>

  <div class="space-y-4 px-5 pt-4 pb-5">
    <!-- Section metadata -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase">Section title</label>
        <Input
          value={section.title}
          placeholder="e.g., About You"
          oninput={(e) => updateField('title', (e.target as HTMLInputElement).value)}
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs font-medium tracking-wider text-gray-500 uppercase"
          >Description <span class="tracking-normal text-gray-600 normal-case">(optional)</span></label
        >
        <Input
          value={section.description ?? ''}
          placeholder="Brief intro for this section..."
          oninput={(e) => updateField('description', (e.target as HTMLInputElement).value)}
        />
      </div>
    </div>

    <!-- Questions with DnD -->
    <div
      use:dndzone={{
        items: dndQuestions,
        flipDurationMs: 200,
        dragDisabled: false,
        type: `questions-${section.id || index}`,
      }}
      onconsider={handleQuestionDndConsider}
      onfinalize={handleQuestionDndFinalize}
      class="space-y-2"
    >
      {#each dndQuestions as question, qIndex (question.id)}
        <div data-question-index="{index}-{qIndex}">
          <QuestionEditor
            dragHandle={true}
            bind:this={questionEditorRefs[qIndex]}
            {question}
            index={qIndex}
            total={section.questions.length}
            expanded={expandedQuestionIndex === qIndex}
            onChange={(q) => updateQuestion(qIndex, q)}
            onDelete={() => deleteQuestion(qIndex)}
            onDuplicate={() => handleDuplicateQuestion(qIndex)}
            onMove={(dir) => moveQuestion(qIndex, dir)}
            onToggle={() => (expandedQuestionIndex = expandedQuestionIndex === qIndex ? null : qIndex)}
          />
        </div>
      {/each}
    </div>

    <!-- Add question type chips -->
    {#if section.questions.length === 0}
      <div class="rounded-lg border border-dashed border-gray-600 px-6 py-8 text-center">
        <p class="mb-4 text-sm text-gray-500">Add your first question</p>
        <div class="flex flex-wrap justify-center gap-2">
          {#each addQuestionTypes as qt (qt.type)}
            <button
              class="hover:border-immich-primary hover:bg-immich-primary-10 hover:text-immich-primary inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-400 transition-all"
              onclick={() => addQuestion(qt.type)}
            >
              <Icon icon={qt.icon} size="15" />
              {qt.label}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="flex flex-wrap items-center gap-1.5">
        {#each addQuestionTypes as qt (qt.type)}
          <button
            class="hover:border-immich-primary hover:bg-immich-primary-5 hover:text-immich-primary inline-flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-500 transition-all"
            onclick={() => addQuestion(qt.type)}
          >
            <Icon icon={qt.icon} size="13" />
            {qt.label}
          </button>
        {/each}
        <div class="relative">
          <button
            class="hover:border-immich-primary hover:bg-immich-primary-5 hover:text-immich-primary inline-flex items-center gap-1 rounded-md border border-gray-700 px-2.5 py-1.5 text-xs text-gray-500 transition-all"
            onclick={() => (showTemplates = !showTemplates)}
          >
            <Icon icon={mdiBookmarkOutline} size="13" />
            Template
          </button>
          {#if showTemplates}
            <div
              class="absolute top-full left-0 z-30 mt-1 w-56 rounded-lg border border-gray-600 bg-gray-900 py-1 shadow-xl"
            >
              {#each [...templatesByCategory.entries()] as [category, templates] (category)}
                <div class="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                  {category}
                </div>
                {#each templates as t (t.id)}
                  <button
                    class="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-gray-800"
                    onclick={() => addFromTemplate(t.id)}
                  >
                    {t.name}
                  </button>
                {/each}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>
