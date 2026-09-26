import { useToast } from '../../context/ToastContext';
import { Toast } from './Toast';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      // Phones: along the bottom, clear of the header. Larger screens: top right.
      className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto sm:top-4 sm:right-4 sm:w-full sm:max-w-md z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
};
