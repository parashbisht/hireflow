import { useState } from 'react';
import type { ReactNode } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-blue-600">HireFlow</span>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;