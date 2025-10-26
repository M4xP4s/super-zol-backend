import fs from 'fs-extra';
export async function trackPhase(phase, status) {
  const file = `thoughts/shared/prs/phase_${phase}.json`;
  await fs.outputJson(file, { phase, status, date: new Date().toISOString() });
}
