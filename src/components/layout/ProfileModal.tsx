import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { updateDisplayName, MAX_DISPLAY_NAME_LENGTH } from '../../services/auth.service';
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

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(userData?.displayName ?? '');
      setError('');
    }
  }, [isOpen, userData?.displayName]);

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
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
