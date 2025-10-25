import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { plugin } from './index';
import { createSigner } from 'fast-jwt';

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
vi.mock('fast-jwt', () => ({
  createSigner: vi.fn(),
}));

describe('plugin SupabaseJWT', () => {
  const mockSign = vi.fn();
  const now = 1_700_000_000;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(now * 1000));
    (createSigner as Mock).mockReturnValue(mockSign);
  });

  const args = {
    values: {
      email: 'john.doe@example.com',
      sub: '30e07a18-aaeb-4811-9577-10551d06ac8a',
      expTime: '60',
      role: 'authenticated',
      projectUrl: 'https://test.supabase.co/auth/v1',
      jwtSecret: 'supersecret',
    },
  };

  const getTemplateFn = () => plugin.templateFunctions?.[0];

  it('should create a signer with the correct key and algorithm', async () => {
    const fn = getTemplateFn();
    if (!fn) throw new Error('Template function not found');
    mockSign.mockReturnValue('mocked.jwt.token');

    const result = await fn.onRender({} as any, args as any);

    expect(createSigner).toHaveBeenCalledWith({
      key: 'supersecret',
      algorithm: 'HS256',
    });
    expect(result).toBe('mocked.jwt.token');
  });

  it('should build the correct payload', async () => {
    const fn = getTemplateFn();
    mockSign.mockReturnValue('mocked.jwt.token');

    await fn?.onRender({} as any, args as any);

    const expectedPayload = {
      iss: 'https://test.supabase.co/auth/v1',
      aud: 'authenticated',
      iat: now,
      exp: now + 60 * 60,
      sub: args.values.sub,
      email: args.values.email,
      role: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: null,
      aal: 'aal1',
      amr: [
        {
          method: 'password',
          timestamp: now,
        },
      ],
      is_anonymous: false,
    };

    expect(mockSign).toHaveBeenCalledWith(expectedPayload);
  });

  it('should default role to "authenticated" when missing', async () => {
    const fn = getTemplateFn();
    mockSign.mockReturnValue('ok');

    const customArgs = { ...args, values: { ...args.values, role: undefined } };
    await fn?.onRender({} as any, customArgs as any);

    const payload = mockSign.mock.calls[0][0];
    expect(payload.role).toBe('authenticated');
    expect(payload.aud).toBe('authenticated');
  });

  it('should use 60 minutes as default expiration when expTime is invalid', async () => {
    const fn = getTemplateFn();
    mockSign.mockReturnValue('ok');

    const customArgs = { ...args, values: { ...args.values, expTime: 'not-a-number' } };
    await fn?.onRender({} as any, customArgs as any);

    const payload = mockSign.mock.calls[0][0];
    expect(payload.exp).toBe(now + 60 * 60); // Default 60 minutes
  });

  it('should throw an error if jwtSecret is missing', async () => {
    const fn = getTemplateFn();
    const badArgs = { ...args, values: { ...args.values, jwtSecret: '' } };

    await expect(fn?.onRender({} as any, badArgs as any)).rejects.toThrow();
  });

  it('should define the expected argument names', () => {
    const fn = getTemplateFn();

    expect(fn?.args.map((a: any) => a.name)).toEqual([
      'email',
      'sub',
      'expTime',
      'role',
      'projectUrl',
      'jwtSecret',
    ]);
  });
});
