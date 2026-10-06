import test from "node:test";
import assert from "node:assert/strict";
import { checkDestructiveCommand, classifyRunner, scoreArgoRisk } from '../src/decisions/devops-gates.ts';

process.env.JEV_BACKEND = 'mock';

test('Level 1: Destructive Command Gate', async () => {
  const result = await checkDestructiveCommand('kubectl delete pvc --all', 'production');
  assert.equal(typeof result, 'number');
});

test('Level 2: Runner Classification', async () => {
  const result = await classifyRunner('FROM node:24');
  assert.ok(['build_cpu_heavy', 'e2e_gpu_required', 'lightweight_lint', 'other'].includes(result));
});

test('Level 3: Argo Risk Score', async () => {
  const result = await scoreArgoRisk('prod', 0.5);
  assert.ok(result >= 0);
});
