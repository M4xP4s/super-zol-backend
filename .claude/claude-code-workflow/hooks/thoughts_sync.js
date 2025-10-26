import fs from 'fs-extra';
export default async function syncThoughts() {
  await fs.ensureDir('thoughts/searchable');
  const shared = 'thoughts/shared';
  const searchable = 'thoughts/searchable';
  for (const dir of ['research', 'plans', 'prs']) {
    await fs.ensureSymlink(`${shared}/${dir}`, `${searchable}/${dir}`, 'dir').catch(() => {
      // Ignore symlink errors (may already exist)
    });
  }
  console.log('[Thoughts] directories synchronized.');
}
