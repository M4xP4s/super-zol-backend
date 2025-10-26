import fs from 'fs-extra';
export default async function afterPhase({ phase }) {
  await fs.ensureDir('thoughts/.logs');
  await fs.writeFile(`thoughts/.logs/${phase}-cleared.log`, new Date().toISOString());
  console.log(`[Context] Cleared after ${phase}`);
}
