import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { updateDisplayName, deleteAccount } from '../../services/auth.service';

vi.mock('../../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../../services/auth.service')>(
    '../../services/auth.service'
  );
  return { ...actual, updateDisplayName: vi.fn(), deleteAccount: vi.fn() };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'u1' },
    userData: { id: 'u1', displayName: 'Ada', email: 'a@b.c', createdAt: 1 },
    loading: false,
  }),
}));

const renderModal = (onClose = () => {}) =>
  render(<ProfileModal isOpen onClose={onClose} />);

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateDisplayName).mockResolvedValue(undefined);
    vi.mocked(deleteAccount).mockResolvedValue(undefined);
  });

  it('starts from the current display name', () => {
    renderModal();

    expect(screen.getByLabelText(/display name/i)).toHaveValue('Ada');
  });

  it('saves a new name', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal(onClose);

    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), 'Grace');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() =>
      expect(updateDisplayName).toHaveBeenCalledWith({ uid: 'u1' }, 'Grace')
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('refuses to save a blank name', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.clear(screen.getByLabelText(/display name/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(updateDisplayName).not.toHaveBeenCalled();
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('explains that the name is visible to people it is shared with', () => {
    renderModal();

    expect(screen.getByText(/anyone you share/i)).toBeInTheDocument();
  });

  it('keeps the modal open and reports the problem when saving fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(updateDisplayName).mockRejectedValue(new Error('permission denied'));
    renderModal(onClose);

    await user.clear(screen.getByLabelText(/display name/i));
    await user.type(screen.getByLabelText(/display name/i), 'Grace');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/permission denied/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  describe('deleting the account', () => {
    it('asks for the password before deleting', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
      expect(deleteAccount).not.toHaveBeenCalled();
    });

    it('deletes the account with the confirmed password', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderModal(onClose);

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      await user.type(screen.getByLabelText(/password/i), 'secret');
      await user.click(screen.getByRole('button', { name: /delete permanently/i }));

      await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ uid: 'u1' }, 'secret'));
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('needs a password', async () => {
      const user = userEvent.setup();
      renderModal();

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      await user.click(screen.getByRole('button', { name: /delete permanently/i }));

      expect(await screen.findByText(/enter your password/i)).toBeInTheDocument();
      expect(deleteAccount).not.toHaveBeenCalled();
    });

    it('explains a wrong password and keeps the account', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      vi.mocked(deleteAccount).mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/invalid-credential' }));
      renderModal(onClose);

      await user.click(screen.getByRole('button', { name: /delete account/i }));
      await user.type(screen.getByLabelText(/password/i), 'nope');
      await user.click(screen.getByRole('button', { name: /delete permanently/i }));

      expect(await screen.findByText(/password is not correct/i)).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
