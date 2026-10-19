import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const NotFound = () => (
  <MainLayout>
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The page you requested does not exist.</p>
      <Link to="/dashboard" className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
        Go to dashboard
      </Link>
    </div>
  </MainLayout>
);

export default NotFound;
