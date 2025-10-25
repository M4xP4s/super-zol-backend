import { writeFile } from 'node:fs/promises';
import type { InventoryAnalysis } from '../../core/domain/entities/inventory.js';

/**
 * Generates a Markdown report from inventory analysis.
 *
 * Creates a comprehensive report with the following sections:
 * - Executive Summary: High-level statistics
 * - Files by Pattern: Grouping of files by naming pattern
 * - Chain Distribution: File counts per supermarket chain
 * - File Type Distribution: File counts per file type
 *
 * @param analysis - The inventory analysis data
 * @param targetDir - The directory that was analyzed
 * @param outputPath - Path where the report should be saved
 * @returns The path to the saved report
 *
 * @example
 * ```typescript
 * const analysis = await analyzeDirectory('./data/kaggle_raw/20240101');
 * if (analysis) {
 *   const reportPath = await generateReport(
 *     analysis,
 *     './data/kaggle_raw/20240101',
 *     './data/reports/inventory_20240101.md'
 *   );
 *   console.log(`Report saved to: ${reportPath}`);
 * }
 * ```
 */
export async function generateReport(
  analysis: InventoryAnalysis,
  targetDir: string,
  outputPath: string
): Promise<string> {
  const sections: string[] = [];

  // Header
  sections.push('# Kaggle Dataset Inventory Report\n');
  sections.push(`**Generated:** ${new Date().toISOString()}\n`);
  sections.push(`**Directory:** ${targetDir}\n`);
  sections.push('---\n');

  // Executive Summary
  sections.push('## Executive Summary\n');
  sections.push(`- **Total Files:** ${analysis.summary.total_files}`);
  sections.push(`- **Total Size:** ${analysis.summary.total_size_mb.toFixed(2)} MB`);
  sections.push(`- **Total Rows:** ${analysis.summary.total_rows}`);
  sections.push(`- **Unique Patterns:** ${Object.keys(analysis.patterns).length}`);
  sections.push(`- **Chains:** ${Object.keys(analysis.chains).length}`);
  sections.push(`- **File Types:** ${Object.keys(analysis.fileTypes).length}`);
  sections.push('');

  // Files by Pattern
  sections.push('## Files by Pattern\n');

  if (Object.keys(analysis.patterns).length === 0) {
    sections.push('*No patterns found*\n');
  } else {
    for (const [pattern, files] of Object.entries(analysis.patterns)) {
      sections.push(`### ${pattern}\n`);
      sections.push(`**Files:** ${files.length}\n`);

      // Show first few files as examples
      const maxExamples = 5;
      const examples = files.slice(0, maxExamples);

      sections.push('**Examples:**\n');
      for (const file of examples) {
        sections.push(`- ${file.filename}`);
      }

      if (files.length > maxExamples) {
        sections.push(`- *... and ${files.length - maxExamples} more*`);
      }

      sections.push('');
    }
  }

  // Chain Distribution
  sections.push('## Chain Distribution\n');

  if (Object.keys(analysis.chains).length === 0) {
    sections.push('*No chains found*\n');
  } else {
    // Sort chains by file count (descending)
    const sortedChains = Object.entries(analysis.chains).sort(([, a], [, b]) => b - a);

    sections.push('| Chain | Files |');
    sections.push('|-------|-------|');

    for (const [chain, count] of sortedChains) {
      sections.push(`| ${chain} | ${count} |`);
    }

    sections.push('');
  }

  // File Type Distribution
  sections.push('## File Type Distribution\n');

  if (Object.keys(analysis.fileTypes).length === 0) {
    sections.push('*No file types found*\n');
  } else {
    // Sort file types by count (descending)
    const sortedTypes = Object.entries(analysis.fileTypes).sort(([, a], [, b]) => b - a);

    sections.push('| File Type | Files |');
    sections.push('|-----------|-------|');

    for (const [fileType, count] of sortedTypes) {
      sections.push(`| ${fileType} | ${count} |`);
    }

    sections.push('');
  }

  // Write report to file
  const reportContent = sections.join('\n');
  await writeFile(outputPath, reportContent, 'utf-8');

  return outputPath;
}
