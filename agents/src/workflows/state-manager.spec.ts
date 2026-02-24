import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskStateManager } from './state-manager.js';
import fs from 'fs';
import path from 'path';

describe('TaskStateManager', () => {
  const cacheDir = path.resolve(process.cwd(), '.cache', 'workflows');
  const taskId = 'test-workflow-123';
  const stateFile = path.join(cacheDir, `${taskId}.json`);

  beforeEach(() => {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  it('should initialize with default state and create cache directory', () => {
    const manager = new TaskStateManager<{ step: string }>(taskId, { step: 'init' }, cacheDir);
    expect(fs.existsSync(cacheDir)).toBe(true);

    const state = manager.getState();
    expect(state.lastOffset).toBe(0);
    expect(state.data.step).toBe('init');
  });

  it('should update state asynchronously and atomically write to disk', async () => {
    const manager = new TaskStateManager<{ items: string[] }>(taskId, { items: [] }, cacheDir);

    await manager.updateState((state) => ({
      processedCount: state.processedCount + 1,
      data: { items: [...state.data.items, 'item1'] },
    }));

    // Discard the instance and load from disk to verify
    const newManager = new TaskStateManager<{ items: string[] }>(taskId, { items: [] }, cacheDir);
    const restoredState = newManager.getState();

    expect(restoredState.processedCount).toBe(1);
    expect(restoredState.data.items).toContain('item1');
  });

  it('should handle concurrent updates without blocking I/O excessively', async () => {
    const manager = new TaskStateManager<{ count: number }>(taskId, { count: 0 }, cacheDir);

    // Promise.all to simulate rapid sequential/concurrent updates in a tight loop
    const updates = Array.from({ length: 50 }).map((_, i) => {
      return manager.updateState((state) => ({
        lastOffset: i + 1,
        processedCount: state.processedCount + 1,
        data: { count: state.data.count + 1 },
      }));
    });

    await Promise.all(updates);

    const finalState = manager.getState();
    expect(finalState.processedCount).toBe(50);
    expect(finalState.data.count).toBe(50);

    // Verify it was correctly saved to disk
    const rawData = fs.readFileSync(stateFile, 'utf8');
    const diskState = JSON.parse(rawData);
    expect(diskState.processedCount).toBe(50);
    expect(diskState.lastOffset).toBe(50);
  });

  it('should clear state on completion', async () => {
    const manager = new TaskStateManager<{ done: boolean }>(taskId, { done: false }, cacheDir);
    await manager.updateState(() => ({ processedCount: 1, data: { done: true } }));

    expect(fs.existsSync(stateFile)).toBe(true);

    await manager.clearState();
    expect(fs.existsSync(stateFile)).toBe(false);
    expect(manager.getState().processedCount).toBe(0);
  });
});
