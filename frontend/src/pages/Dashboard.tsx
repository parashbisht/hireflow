import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome, {user?.name}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Logged in as: {user?.email} ({user?.role})
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Full dashboard with stats and charts arrives in Phase 7.
        </p>
      </div>
    </MainLayout>
  );
};

export default Dashboard;