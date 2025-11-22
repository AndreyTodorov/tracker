import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AuthLayout } from './components/auth/AuthLayout';
import { Dashboard } from './components/layout/Dashboard';
import { PublicPortfolio } from './components/public/PublicPortfolio';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ToastContainer } from './components/ui/ToastContainer';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" replace />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return currentUser ? <Navigate to="/" replace /> : <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/tracker">
        <ToastProvider>
          <AuthProvider>
            <ToastContainer />
            <ErrorBoundary>
              <Routes>
              {/* Public Routes */}
              <Route
                path="/public"
                element={
                  <ErrorBoundary>
                    <PublicPortfolio />
                  </ErrorBoundary>
                }
              />

              {/* Auth Routes */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <ErrorBoundary>
                      <AuthLayout />
                    </ErrorBoundary>
                  </AuthRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <Dashboard />
                    </ErrorBoundary>
                  </ProtectedRoute>
                }
              />
              </Routes>
            </ErrorBoundary>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
