import { expect, test } from 'bun:test';
import { checkDestructiveCommand, classifyRunner, scoreArgoRisk } from '../src/decisions/devops-gates';

process.env.JEV_BACKEND = 'mock';

test('Level 1: Destructive Command Gate', async () => {
  const result = await checkDestructiveCommand('kubectl delete pvc --all', 'production');
  expect(typeof result).toBe('number');
});

test('Level 2: Runner Classification', async () => {
  const result = await classifyRunner('FROM node:24');
  expect(['build_cpu_heavy', 'e2e_gpu_required', 'lightweight_lint', 'other']).toContain(result);
});

test('Level 3: Argo Risk Score', async () => {
  const result = await scoreArgoRisk('prod', 0.5);
  expect(result).toBeGreaterThanOrEqual(0);
});
