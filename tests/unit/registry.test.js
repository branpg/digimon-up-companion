import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateModuleEntry, loadRegistry } from '../../public/js/registry.js';

describe('validateModuleEntry', () => {
  it('accepts a valid module entry with all required fields', () => {
    const entry = { id: 'memory-helper', name: 'Memory Helper', icon: '🎴', path: 'modules/memory-helper' };
    expect(validateModuleEntry(entry)).toBe(true);
  });

  it('accepts a valid entry with optional default field', () => {
    const entry = { id: 'memory-helper', name: 'Memory Helper', icon: '🎴', path: 'modules/memory-helper', default: true };
    expect(validateModuleEntry(entry)).toBe(true);
  });

  it('rejects null entry', () => {
    expect(validateModuleEntry(null)).toBe(false);
  });

  it('rejects undefined entry', () => {
    expect(validateModuleEntry(undefined)).toBe(false);
  });

  it('rejects non-object entry', () => {
    expect(validateModuleEntry('string')).toBe(false);
    expect(validateModuleEntry(42)).toBe(false);
  });

  it('rejects entry with missing id', () => {
    const entry = { name: 'Test', icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with empty id', () => {
    const entry = { id: '', name: 'Test', icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with non-string id', () => {
    const entry = { id: 123, name: 'Test', icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with missing name', () => {
    const entry = { id: 'test', icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with empty name', () => {
    const entry = { id: 'test', name: '', icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with name longer than 50 characters', () => {
    const entry = { id: 'test', name: 'a'.repeat(51), icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('accepts entry with name exactly 50 characters', () => {
    const entry = { id: 'test', name: 'a'.repeat(50), icon: '🎴', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(true);
  });

  it('rejects entry with missing icon', () => {
    const entry = { id: 'test', name: 'Test', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with empty icon', () => {
    const entry = { id: 'test', name: 'Test', icon: '', path: 'modules/test' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with missing path', () => {
    const entry = { id: 'test', name: 'Test', icon: '🎴' };
    expect(validateModuleEntry(entry)).toBe(false);
  });

  it('rejects entry with empty path', () => {
    const entry = { id: 'test', name: 'Test', icon: '🎴', path: '' };
    expect(validateModuleEntry(entry)).toBe(false);
  });
});

describe('loadRegistry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid modules from a successful fetch', async () => {
    const mockData = {
      version: '1.0.0',
      modules: [
        { id: 'memory-helper', name: 'modules.memoryHelper.name', icon: '🎴', path: 'modules/memory-helper', default: true },
        { id: 'passive-calc', name: 'modules.passiveCalc.name', icon: '💎', path: 'modules/passive-calc' }
      ]
    };

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    const result = await loadRegistry();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('memory-helper');
    expect(result[1].id).toBe('passive-calc');
  });

  it('skips invalid entries and returns only valid ones', async () => {
    const mockData = {
      version: '1.0.0',
      modules: [
        { id: 'valid', name: 'Valid Module', icon: '✅', path: 'modules/valid' },
        { id: '', name: 'Invalid', icon: '❌', path: 'modules/invalid' },
        { id: 'also-valid', name: 'Also Valid', icon: '✅', path: 'modules/also-valid' }
      ]
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    const result = await loadRegistry();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('valid');
    expect(result[1].id).toBe('also-valid');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('logs warning with module id for invalid entry that has an id', async () => {
    const mockData = {
      version: '1.0.0',
      modules: [
        { id: 'broken', name: '', icon: '❌', path: 'modules/broken' }
      ]
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    await loadRegistry();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('broken'));
  });

  it('logs warning with index for invalid entry that has no id', async () => {
    const mockData = {
      version: '1.0.0',
      modules: [
        { name: 'No ID', icon: '❌', path: 'modules/no-id' }
      ]
    };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    await loadRegistry();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('index 0'));
  });

  it('returns empty array when fetch fails with non-ok status', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404
      })
    ));

    const result = await loadRegistry();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns empty array when fetch throws a network error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

    const result = await loadRegistry();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns empty array when modules field is not an array', async () => {
    const mockData = { version: '1.0.0', modules: 'not-an-array' };

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    const result = await loadRegistry();
    expect(result).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns empty array when registry has no modules', async () => {
    const mockData = { version: '1.0.0', modules: [] };

    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    ));

    const result = await loadRegistry();
    expect(result).toEqual([]);
  });
});
