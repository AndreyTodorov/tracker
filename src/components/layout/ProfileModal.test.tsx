import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from './ProfileModal';
import { updateDisplayName } from '../../services/auth.service';

vi.mock('../../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../../services/auth.service')>(
    '../../services/auth.service'
  );
  return { ...actual, updateDisplayName: vi.fn() };
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
});
