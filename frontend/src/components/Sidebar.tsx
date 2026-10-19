import { NavLink } from 'react-router-dom';
import { X, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/ai-matcher', label: 'AI Resume Matcher', restrictedTo: ['ADMIN', 'RECRUITER'] },
];

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user, role, isViewer, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (item.restrictedTo && isViewer) return false;
    return true;
  });

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden ${isOpen ? 'block' : 'hidden'}`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:min-h-screen md:w-60 md:translate-x-0 dark:border-slate-800 dark:bg-slate-900 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-teal-50 px-6 py-5 dark:border-slate-800 dark:from-indigo-950/60 dark:to-teal-950/40">
          <div>
            <h1 className="text-xl font-bold text-indigo-950 dark:text-white">HireFlow</h1>
            {user?.organizationName && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                <Building2 size={12} />
                <span className="truncate max-w-[120px]">{user.organizationName}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1 text-slate-500 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-slate-200 px-3 py-4 dark:border-slate-800">
          {user && (
            <div className="px-3 py-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                    role === 'ADMIN'
                      ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200'
                      : role === 'RECRUITER'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {role ?? 'VIEWER'}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
