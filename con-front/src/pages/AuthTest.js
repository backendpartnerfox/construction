import React from 'react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthTest = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const clearAuthData = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('debugToken');
    toast.success('Auth data cleared. Refresh page to see effect.');
    setTimeout(() => window.location.reload(), 1000);
  };

  const setMockAuth = () => {
    const mockUser = {
      id: 1,
      username: 'admin',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com'
    };
    const mockToken = 'mock-token-' + Date.now();
    
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    toast.success('Mock auth set. Refresh page to see effect.');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Authentication Test</h1>
        
        {/* Current Auth State */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication State</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Auth Context State:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
                <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
                <p><strong>Has User:</strong> {user ? 'true' : 'false'}</p>
                {user && (
                  <div className="mt-2">
                    <p><strong>User ID:</strong> {user.id}</p>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Local Storage:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>Auth Token:</strong> {localStorage.getItem('authToken') ? 'Present' : 'Not found'}</p>
                <p><strong>User Data:</strong> {localStorage.getItem('user') ? 'Present' : 'Not found'}</p>
                {localStorage.getItem('authToken') && (
                  <div className="mt-2">
                    <p><strong>Token:</strong> {localStorage.getItem('authToken')?.substring(0, 20)}...</p>
                  </div>
                )}
                {localStorage.getItem('user') && (
                  <div className="mt-2">
                    <p><strong>Stored User:</strong></p>
                    <pre className="text-xs mt-1 bg-white p-2 rounded overflow-x-auto">
                      {localStorage.getItem('user')}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Login Page
            </button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </button>
            
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Profile
            </button>
            
            <button
              onClick={setMockAuth}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Set Mock Auth
            </button>
            
            <button
              onClick={clearAuthData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Auth Data
            </button>
            
            {isAuthenticated && (
              <button
                onClick={logout}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Expected Behavior</h2>
          <div className="space-y-2 text-yellow-700">
            <p><strong>When NOT authenticated:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Clicking "Go to Login Page" should show the login form</li>
              <li>Clicking "Go to Dashboard" should redirect to login page</li>
              <li>Clicking "Go to Profile" should redirect to login page</li>
            </ul>
            
            <p className="mt-4"><strong>When authenticated:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Clicking "Go to Login Page" should redirect to dashboard</li>
              <li>Clicking "Go to Dashboard" should show dashboard</li>
              <li>Clicking "Go to Profile" should show profile page</li>
            </ul>
            
            <p className="mt-4"><strong>URL behavior:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>If logged in and you type "/login" in URL, should redirect to "/dashboard"</li>
              <li>If not logged in and you type "/dashboard" in URL, should redirect to "/login"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;