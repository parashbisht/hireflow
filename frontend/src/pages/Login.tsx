import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-teal-50 px-4 py-16 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100 sm:px-6">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6"><ThemeToggle /></div>
      <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_28rem]">
        <section className="hidden max-w-xl lg:block">
          <div className="mb-12 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 text-lg font-bold text-white shadow-lg shadow-indigo-600/20">H</span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">HireFlow</span>
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-300">People, in motion</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-slate-950 dark:text-white">Build a team that moves you forward.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">A clearer view of every candidate, conversation, and next step.</p>
        </section>

        <section className="mx-auto w-full max-w-md rounded-3xl border border-white/80 bg-white/90 p-7 shadow-2xl shadow-indigo-950/10 backdrop-blur sm:p-9 dark:border-slate-700/80 dark:bg-slate-900/90 dark:shadow-black/30">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-teal-500 font-bold text-white">H</span>
            <span className="font-bold text-slate-900 dark:text-white">HireFlow</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">Account access</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Sign in to your HireFlow workspace.</p>

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-slate-900">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/80 px-3.5 py-3 text-xs leading-5 text-indigo-950 dark:border-indigo-900/70 dark:bg-indigo-950/50 dark:text-indigo-100">
            <span className="font-semibold">Demo login</span><br />admin@hireflow.com / demo1234
          </p>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Create one</Link>
          </p>
        </section>
      </div>
    </main>
  );
};

export default Login;
