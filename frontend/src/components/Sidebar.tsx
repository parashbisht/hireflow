import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/ai-matcher', label: 'AI Resume Matcher' },
];

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { logout } = useAuth();

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${isOpen ? 'block' : 'hidden'}`}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex min-h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:static md:min-h-screen md:w-56 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <h1 className="text-xl font-bold text-blue-600">HireFlow</h1>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-md p-1 text-gray-500 hover:bg-gray-100 md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <button onClick={() => { logout(); onClose(); }} className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;