import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreateBrowserClient = vi.fn(() => ({
  id: Symbol('supabase-client'),
}));

vi.mock('@supabase/ssr/dist/module', () => ({
  createBrowserClient: mockCreateBrowserClient,
}));

const ORIGINAL_ENV = process.env;

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV };
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
};

describe('supabase client singleton', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateBrowserClient.mockClear();
    resetEnv();
    delete (globalThis as typeof globalThis & { __supabaseClient?: unknown }).__supabaseClient;
  });

  it('reuses the same browser client instance for every call', async () => {
    const { createClient } = await import('../../src/lib/supabase/client');

    const first = createClient();
    const second = createClient();

    expect(first).toBe(second);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });

  it('shares the instance exported via `supabase` constant', async () => {
    const module = await import('../../src/lib/supabase/client');

    const direct = module.supabase;
    const viaFactory = module.createClient();

    expect(direct).toBe(viaFactory);
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
  });
});
