import { useEffect, useState } from 'react';
import api from './services/api';

/**
 * Phase 1 placeholder.
 *
 * This screen exists only to prove the full stack is wired up correctly:
 * React (frontend) -> Axios -> Express (backend) -> JSON response.
 *
 * From Phase 3 onward this will be replaced by React Router routes
 * (Login, Dashboard, Jobs, Candidates, Pipeline, AI Resume Matcher).
 */

type HealthResponse = {
  success: boolean;
  message: string;
  environment: string;
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<HealthResponse>('/health')
      .then((res) => setHealth(res.data))
      .catch(() =>
        setError(
          'Could not reach the backend. Make sure it is running on http://localhost:5000'
        )
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-brand-700">HireFlow</h1>
        <p className="text-gray-500 mt-1">Recruitment Management System</p>

        <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm">
          {loading && <p className="text-gray-500">Checking backend connection…</p>}

          {!loading && health && (
            <div className="text-green-700">
              <p className="font-medium">✅ {health.message}</p>
              <p className="text-gray-500 mt-1">Environment: {health.environment}</p>
            </div>
          )}

          {!loading && error && <p className="text-red-600">❌ {error}</p>}
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Phase 1: Project setup — Auth, Jobs, Candidates and the rest of the app
          arrive in later phases.
        </p>
      </div>
    </div>
  );
}

export default App;
