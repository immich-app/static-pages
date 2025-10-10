export class SvelteFile {
  /**
   * @type {string[]}
   * @private
   */
  scripts = [];

  /**
   * @type {string[]}
   * @private
   */
  lines = [];

  /**
   * @type {string[]}
   * @private
   */
  closingTags = [];

  /** @type {string} */
  addScript(line) {
    if (line) {
      this.scripts.push(line);
    }
    return this;
  }

  /** @type {string} */
  addTemplate(line) {
    this.lines.push(line);
    return this;
  }

  addTag(tag, closingTag) {
    this.lines.push(tag);
    this.closingTags.push(closingTag);
  }

  export() {
    const lines = [];

    lines.push(`<script lang="ts">`);
    for (const line of this.scripts) {
      lines.push('  ' + line);
    }
    lines.push('</script>');

    for (const line of this.lines) {
      lines.push(line);
    }

    for (const line of this.closingTags.toReversed()) {
      lines.push(line);
    }

    return lines.join('\n');
  }
}
