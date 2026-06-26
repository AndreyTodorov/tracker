import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { TrendingUp } from 'lucide-react';

export const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Ambient warm glow — restrained, single hue */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="grid place-items-center w-14 h-14 rounded-xl bg-accent/10 border border-accent/30">
              <TrendingUp size={28} className="text-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Investment Tracker</h1>
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
