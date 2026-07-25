import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, updateDisplayName, MAX_DISPLAY_NAME_LENGTH } from './auth.service';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { get, set, update } from 'firebase/database';

vi.mock('../config/firebase', () => ({ auth: {}, db: {} }));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(async () => undefined),
}));

vi.mock('firebase/database', () => ({
  // Returning the path makes the fake database below readable.
  ref: vi.fn((_db: unknown, path?: string) => path ?? ''),
  set: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  onValue: vi.fn(),
}));

// Minimal stand-in for the database so idempotency is genuinely exercised
// rather than asserted against call counts alone.
let store: Map<string, Record<string, unknown>>;

const user = { uid: 'u1', email: 'a@b.c', displayName: 'Ada' };

const pathsUnder = (prefix: string) =>
  [...store.keys()].filter((key) => key.startsWith(prefix));

beforeEach(() => {
  vi.clearAllMocks();
  store = new Map();

  vi.mocked(get).mockImplementation(async (path: unknown) => ({
    exists: () => store.has(path as string),
    val: () => store.get(path as string),
  }) as never);

  vi.mocked(set).mockImplementation(async (path: unknown, value: unknown) => {
    store.set(path as string, value as Record<string, unknown>);
  });

  vi.mocked(update).mockResolvedValue(undefined);
  vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user } as never);
  vi.mocked(signInWithEmailAndPassword).mockResolvedValue({ user } as never);
});

describe('auth.service account records', () => {

  it('creates the user record and share code index on signup', async () => {
    await signUp('a@b.c', 'password', '  Ada  ');

    expect(store.get('users/u1')).toMatchObject({
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ada',
    });

    const [indexPath] = pathsUnder('shareCodeIndex/');
    expect(indexPath).toBeDefined();
    expect(store.get(indexPath)).toEqual({ uid: 'u1', displayName: 'Ada' });
  });

  it('repairs an account whose record was never written', async () => {
    // What signup leaves behind when it fails after creating the auth account:
    // the user can log in, but has no database record and no way to get one.
    await signIn('a@b.c', 'password');

    expect(store.get('users/u1')).toMatchObject({ id: 'u1', displayName: 'Ada' });
    expect(pathsUnder('shareCodeIndex/')).toHaveLength(1);
  });

  it('repairs a missing share code index entry', async () => {
    store.set('users/u1', {
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ada',
      createdAt: 1,
      shareCode: 'ABC12345',
    });

    await signIn('a@b.c', 'password');

    expect(store.get('shareCodeIndex/ABC12345')).toEqual({
      uid: 'u1',
      displayName: 'Ada',
    });
  });

  it('leaves a healthy account completely untouched', async () => {
    store.set('users/u1', {
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ada',
      createdAt: 1,
      shareCode: 'ABC12345',
    });
    store.set('shareCodeIndex/ABC12345', { uid: 'u1', displayName: 'Ada' });

    await signIn('a@b.c', 'password');

    expect(set).not.toHaveBeenCalled();
  });

  it('does not keep the user out when the repair itself fails', async () => {
    vi.mocked(set).mockRejectedValue(new Error('permission denied'));

    // A transient database failure must not block sign-in for someone whose
    // account is fine.
    await expect(signIn('a@b.c', 'password')).resolves.toMatchObject({ uid: 'u1' });
  });
});

describe('updateDisplayName', () => {
  const healthyAccount = () => {
    store.set('users/u1', {
      id: 'u1',
      email: 'a@b.c',
      displayName: 'Ada',
      createdAt: 1,
      shareCode: 'ABC12345',
    });
  };

  it('renames every copy of the name in a single atomic write', async () => {
    healthyAccount();
    store.set('investments/u1', { i1: { userName: 'Ada' }, i2: { userName: 'Ada' } });
    store.set('publicProfiles/u1', { displayName: 'Ada' });

    await updateDisplayName(user as never, 'Grace');

    // One multi-path update, so a partial rename cannot leave copies disagreeing.
    expect(update).toHaveBeenCalledTimes(1);
    expect(vi.mocked(update).mock.calls[0][1]).toEqual({
      'users/u1/displayName': 'Grace',
      'shareCodeIndex/ABC12345/displayName': 'Grace',
      'publicProfiles/u1/displayName': 'Grace',
      'investments/u1/i1/userName': 'Grace',
      'investments/u1/i2/userName': 'Grace',
    });
  });

  it('leaves publicProfiles alone when the user is not listed', async () => {
    healthyAccount();

    await updateDisplayName(user as never, 'Grace');

    expect(vi.mocked(update).mock.calls[0][1]).not.toHaveProperty('publicProfiles/u1/displayName');
  });

  it('updates the auth profile as well as the database', async () => {
    healthyAccount();

    await updateDisplayName(user as never, 'Grace');

    expect(updateProfile).toHaveBeenCalledWith(user, { displayName: 'Grace' });
  });

  it('trims the new name', async () => {
    healthyAccount();

    await updateDisplayName(user as never, '  Grace  ');

    expect(vi.mocked(update).mock.calls[0][1]).toMatchObject({ 'users/u1/displayName': 'Grace' });
  });

  it('rejects a blank name', async () => {
    healthyAccount();

    await expect(updateDisplayName(user as never, '   ')).rejects.toThrow('Display name is required');
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects a name longer than the database allows', async () => {
    healthyAccount();

    await expect(
      updateDisplayName(user as never, 'x'.repeat(MAX_DISPLAY_NAME_LENGTH + 1))
    ).rejects.toThrow('Display name must be');
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses to rename an account with no record rather than writing a partial one', async () => {
    await expect(updateDisplayName(user as never, 'Grace')).rejects.toThrow();
    expect(update).not.toHaveBeenCalled();
  });
});
