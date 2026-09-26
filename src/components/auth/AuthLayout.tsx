import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { TrendingUp } from 'lucide-react';

export const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="grid place-items-center w-14 h-14 rounded-2xl bg-accent text-ink">
              <TrendingUp size={28} strokeWidth={2.4} />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] mb-2">Investment Tracker</h1>
          <p className="text-muted">Track your crypto investments in real-time</p>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
