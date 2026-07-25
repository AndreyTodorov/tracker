import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ToastContainer } from './components/ui/ToastContainer';

// Route components are code-split so each entry only ships what it needs.
const AuthLayout = lazy(() =>
  import('./components/auth/AuthLayout').then((m) => ({ default: m.AuthLayout }))
);
const Dashboard = lazy(() =>
  import('./components/layout/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const PublicPortfolio = lazy(() =>
  import('./components/public/PublicPortfolio').then((m) => ({ default: m.PublicPortfolio }))
);

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

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
            <CurrencyProvider>
              <ToastContainer />
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
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

                {/* Unknown paths fall back to the dashboard (or login if signed out) */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                </Suspense>
              </ErrorBoundary>
            </CurrencyProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
