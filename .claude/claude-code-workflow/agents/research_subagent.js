import fs from 'fs-extra';
export async function runResearch(topic) {
  const now = new Date().toISOString().split('T')[0];
  const file = `thoughts/shared/research/${now}_${topic.replace(/\s+/g, '-')}.md`;
  const result = `# Research on ${topic}\n\n- Summary:\n- Code References:\n- Architecture Insights:\n- Open Questions:\n`;
  await fs.outputFile(file, result);
  return { file };
}
