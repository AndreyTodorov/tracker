import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { type Toast as ToastType } from '../../context/ToastContext';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

// Auto-dismiss is handled centrally by ToastProvider; this component only renders.
export const Toast = ({ toast, onClose }: ToastProps) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} className="text-profit" />;
      case 'error':
        return <XCircle size={20} className="text-loss" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-400" />;
      case 'info':
        return <Info size={20} className="text-accent" />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-profit/30';
      case 'error':
        return 'border-loss/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'info':
        return 'border-accent/30';
    }
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border bg-surface2/95
        ${getStyles()}
        shadow-panel backdrop-blur-md
        animate-in slide-in-from-right-full duration-300
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <p className="flex-1 text-sm text-content">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-muted hover:text-content transition-colors"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};
