import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { TrendingUp, Eye, ArrowRight } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [shareCode, setShareCode] = useState('');
  const navigate = useNavigate();

  const handleViewPublicPortfolio = () => {
    if (shareCode.trim().length === 8) {
      navigate(`/public?code=${shareCode.trim().toUpperCase()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleViewPublicPortfolio();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp size={48} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Investment Tracker
          </h1>
          <p className="text-gray-400">Track your crypto investments in real-time</p>
        </div>

        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}

        {/* Public Portfolio Access */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-950 text-gray-400">Or view a public portfolio</span>
            </div>
          </div>

          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={20} className="text-purple-400" />
              <h3 className="font-semibold text-sm">View Shared Portfolio</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Enter a share code to view someone's portfolio without logging in
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 8-character code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                maxLength={8}
                className="flex-1"
              />
              <Button
                onClick={handleViewPublicPortfolio}
                disabled={shareCode.trim().length !== 8}
                className="px-4"
              >
                <ArrowRight size={18} />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
