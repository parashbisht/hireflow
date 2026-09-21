import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
};

export default MainLayout;