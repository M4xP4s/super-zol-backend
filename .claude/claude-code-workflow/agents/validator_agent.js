import { exec } from 'child_process';
export async function runValidation() {
  return new Promise((resolve) => {
    exec('npm test && npm run lint', (err) => {
      resolve({ status: err ? 'failed' : 'passed' });
    });
  });
}
