import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Logged in as: {user?.email} ({user?.role})</p>
          <p className="text-gray-400 text-sm mt-2">Full dashboard with stats and charts arrives in Phase 7.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;