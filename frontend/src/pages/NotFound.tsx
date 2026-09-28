import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const NotFound = () => (
  <MainLayout>
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold text-blue-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">The page you requested does not exist.</p>
      <Link to="/dashboard" className="mt-5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Go to dashboard
      </Link>
    </div>
  </MainLayout>
);

export default NotFound;
