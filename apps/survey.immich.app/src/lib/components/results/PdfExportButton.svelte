<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiFilePdfBox } from '@mdi/js';

  interface Props {
    targetSelector: string;
    filename?: string;
  }

  let { targetSelector, filename = 'survey-results.pdf' }: Props = $props();
  let exporting = $state(false);
  let error = $state<string | null>(null);

  async function handleExport() {
    exporting = true;
    error = null;
    try {
      const { jsPDF } = await import('jspdf');

      const element = document.querySelector(targetSelector);
      if (!element) {
        error = 'Could not find content to export';
        exporting = false;
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const usableWidth = pageWidth - margin * 2;
      let y = margin;

      function addText(text: string, size: number, bold = false, color: [number, number, number] = [255, 255, 255]) {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text, usableWidth);
        for (const line of lines) {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += size * 0.45;
        }
      }

      function addSpace(mm: number) {
        y += mm;
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      }

      // Dark background
      pdf.setFillColor(17, 24, 39);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Title
      const title = element.querySelector('h1')?.textContent ?? 'Survey Results';
      addText(title, 20, true);
      addSpace(4);

      // Stats
      const statCards = element.querySelectorAll('.grid > div');
      if (statCards.length > 0) {
        const stats: string[] = [];
        for (const card of statCards) {
          const label = card.querySelector('.uppercase')?.textContent?.trim() ?? '';
          const value = card.querySelector('.text-2xl')?.textContent?.trim() ?? '';
          if (label && value) stats.push(`${label}: ${value}`);
        }
        if (stats.length > 0) {
          addText(stats.join('  •  '), 11, false, [156, 163, 175]);
          addSpace(6);
        }
      }

      // Charts — render canvases as images in the PDF
      const chartContainers = element.querySelectorAll('.rounded-xl');
      for (const container of chartContainers) {
        const heading = container.querySelector('h3')?.textContent?.trim();
        if (!heading) continue;

        addSpace(3);
        addText(heading, 13, true);
        addSpace(2);

        const responseCount = container.querySelector('.text-gray-500')?.textContent?.trim();
        if (responseCount) {
          addText(responseCount, 9, false, [107, 114, 128]);
          addSpace(2);
        }

        // Try to capture canvas charts
        const canvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (canvas) {
          try {
            const imgData = canvas.toDataURL('image/png');
            const ratio = canvas.height / canvas.width;
            const imgWidth = Math.min(usableWidth, 160);
            const imgHeight = imgWidth * ratio;

            if (y + imgHeight > pageHeight - margin) {
              pdf.addPage();
              pdf.setFillColor(17, 24, 39);
              pdf.rect(0, 0, pageWidth, pageHeight, 'F');
              y = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 4;
          } catch {
            addText('[Chart could not be exported]', 9, false, [107, 114, 128]);
          }
        }

        // Text answers (non-chart questions)
        const answerCards = container.querySelectorAll('.bg-gray-100, .dark\\:bg-gray-800');
        if (answerCards.length > 0 && !canvas) {
          for (const card of Array.from(answerCards).slice(0, 15)) {
            const text = card.querySelector('p')?.textContent?.trim();
            if (text) {
              addText(`• ${text}`, 9, false, [209, 213, 219]);
              addSpace(1);
            }
          }
        }

        addSpace(3);
      }

      pdf.save(filename);
    } catch (e) {
      console.error('PDF export failed:', e);
      error = e instanceof Error ? e.message : 'PDF export failed';
      setTimeout(() => (error = null), 4000);
    }
    exporting = false;
  }
</script>

<div class="relative inline-flex">
  <button
    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-200 disabled:opacity-50 dark:border-gray-700"
    disabled={exporting}
    onclick={handleExport}
  >
    <Icon icon={mdiFilePdfBox} size="15" />
    {exporting ? 'Exporting...' : 'PDF'}
  </button>
  {#if error}
    <span class="absolute top-full right-0 mt-1 whitespace-nowrap rounded bg-red-600 px-2 py-1 text-xs text-white shadow-lg">{error}</span>
  {/if}
</div>
