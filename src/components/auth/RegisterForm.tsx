import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { signUp } from '../../services/auth.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../context/ToastContext';

interface RegisterFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm = ({ onToggleMode }: RegisterFormProps) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const toast = useToast();

  const password = watch('password');

  const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error?.code || '';

    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return error?.message || 'Failed to create account. Please try again.';
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    setIsLoading(true);

    try {
      await signUp(data.email, data.password, data.displayName);
      toast.success('Account created successfully! Welcome aboard!');
    } catch (err: any) {
      const errorMessage = getFirebaseErrorMessage(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass-strong rounded-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
            <UserPlus size={32} className="text-white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-gray-400 text-center mb-6">Join us and start tracking your investments</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Display Name"
            type="text"
            placeholder="John Doe"
            {...register('displayName', {
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            error={errors.displayName?.message}
          />

          <Input
            label="Email"
            type="email"
            placeholder="your@email.com"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            error={errors.password?.message}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
