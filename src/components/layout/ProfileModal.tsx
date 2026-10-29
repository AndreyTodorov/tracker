import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { updateDisplayName, deleteAccount, MAX_DISPLAY_NAME_LENGTH } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { currentUser, userData } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(userData?.displayName ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(userData?.displayName ?? '');
      setError('');
      setConfirmingDelete(false);
      setPassword('');
      setDeleteError('');
    }
  }, [isOpen, userData?.displayName]);

  const handleDelete = async () => {
    if (!currentUser) return;
    if (!password) {
      setDeleteError('Enter your password to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(currentUser, password);
      // Signing out happens by itself once the account is gone; the router then shows the login page.
      toast.success('Your account and all its data have been deleted.');
      onClose();
    } catch (caught: unknown) {
      const code = (caught as { code?: string })?.code;
      setDeleteError(
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'That password is not correct.'
          : (caught as { message?: string })?.message || 'Failed to delete your account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Display name is required');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await updateDisplayName(currentUser, trimmed);
      toast.success('Display name updated!');
      onClose();
    } catch (caught: unknown) {
      const message =
        (caught as { message?: string })?.message || 'Failed to update your name. Please try again.';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your profile" size="sm">
      <div className="space-y-4">
        <Input
          label="Display name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          error={error}
        />

        <p className="text-xs text-muted">
          This is the name shown next to your investments to anyone you share your
          portfolio with. Changing it updates your existing investments too.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-full" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="flex-1 rounded-full" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>

        <div className="border-t border-line pt-4 space-y-3">
          {confirmingDelete ? (
            <>
              <p className="text-sm">
                This deletes your account, all your investments, your share code and your public
                profile. It cannot be undone.
              </p>
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={deleteError}
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-full"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Keep account
                </Button>
                <Button variant="danger" className="flex-1 rounded-full" onClick={handleDelete} isLoading={isDeleting}>
                  Delete permanently
                </Button>
              </div>
            </>
          ) : (
            <Button variant="ghost" className="w-full rounded-full text-loss" onClick={() => setConfirmingDelete(true)}>
              Delete account
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
