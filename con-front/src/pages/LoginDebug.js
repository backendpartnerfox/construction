import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginDebug = () => {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: 'admin123'
  });
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, status, details) => {
    const result = {
      test,
      status,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
    console.log(`[${result.timestamp}] ${test}: ${status}`, details);
  };

  const testBackendConnection = async () => {
    setTesting(true);
    setTestResults([]);
    
    // Test 1: Direct backend health check
    try {
      addResult('Backend Health Check', 'Testing...', 'Checking if backend is running');
      
      const healthResponse = await fetch('http://localhost:9000/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addResult('Backend Health Check', 'SUCCESS', healthData);
      } else {
        addResult('Backend Health Check', 'FAILED', `HTTP ${healthResponse.status}`);
      }
    } catch (error) {
      addResult('Backend Health Check', 'FAILED', error.message);
    }

    // Test 2: Proxy connection
    try {
      addResult('Proxy Connection', 'Testing...', 'Testing /api proxy');
      
      const proxyResponse = await fetch('/api/health');
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        addResult('Proxy Connection', 'SUCCESS', proxyData);
      } else {
        addResult('Proxy Connection', 'FAILED', `HTTP ${proxyResponse.status}`);
      }
    } catch (error) {
      addResult('Proxy Connection', 'FAILED', error.message);
    }

    // Test 3: Login endpoint
    try {
      addResult('Login Endpoint', 'Testing...', 'Testing login with admin/admin123');
      
      const loginData = {
        username: credentials.username,
        password: credentials.password,
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      };

      const loginResponse = await fetch('/api/user-sessions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        addResult('Login Endpoint', 'SUCCESS', loginResult);
        
        // Store token temporarily for other tests
        if (loginResult.session?.token || loginResult.token) {
          localStorage.setItem('debugToken', loginResult.session?.token || loginResult.token);
        }
      } else {
        const errorText = await loginResponse.text();
        addResult('Login Endpoint', 'FAILED', `HTTP ${loginResponse.status}: ${errorText}`);
      }
    } catch (error) {
      addResult('Login Endpoint', 'FAILED', error.message);
    }

    // Test 4: Protected endpoint (if we have a token)
    const debugToken = localStorage.getItem('debugToken');
    if (debugToken) {
      try {
        addResult('Protected Endpoint', 'Testing...', 'Testing /api/users/profile with token');
        
        const profileResponse = await fetch('/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${debugToken}`,
            'Accept': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          addResult('Protected Endpoint', 'SUCCESS', profileData);
        } else {
          const errorText = await profileResponse.text();
          addResult('Protected Endpoint', 'FAILED', `HTTP ${profileResponse.status}: ${errorText}`);
        }
      } catch (error) {
        addResult('Protected Endpoint', 'FAILED', error.message);
      }
    }

    setTesting(false);
  };

  const testDifferentCredentials = async () => {
    const testCreds = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'admin', password: '123456' },
      { username: 'testuser', password: 'test123' },
      { username: 'user', password: 'user123' }
    ];

    for (const cred of testCreds) {
      try {
        addResult(`Login Test ${cred.username}/${cred.password}`, 'Testing...', '');
        
        const response = await fetch('/api/user-sessions/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...cred,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent
          })
        });

        if (response.ok) {
          const result = await response.json();
          addResult(`Login Test ${cred.username}/${cred.password}`, 'SUCCESS', result);
          break; // Stop on first successful login
        } else {
          const errorText = await response.text();
          addResult(`Login Test ${cred.username}/${cred.password}`, 'FAILED', errorText);
        }
      } catch (error) {
        addResult(`Login Test ${cred.username}/${cred.password}`, 'FAILED', error.message);
      }
    }
  };

  const simulateSuccessfulLogin = () => {
    // Simulate a successful login for testing the app
    const mockUser = {
      id: 1,
      username: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@constructpro.com'
    };
    const mockToken = 'mock-token-' + Date.now();
    
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    toast.success('Mock login successful! You can now access the app.');
    
    // Reload the page to trigger auth state update
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Login Debug Tool</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Use this tool to debug login issues. It will test the backend connection, 
              proxy setup, and various login scenarios.
            </p>
          </div>
        </div>

        {/* Credentials Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testBackendConnection}
              disabled={testing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Backend & Login'}
            </button>
            
            <button
              onClick={testDifferentCredentials}
              disabled={testing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Try Multiple Credentials
            </button>
            
            <button
              onClick={simulateSuccessfulLogin}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Simulate Successful Login
            </button>
            
            <Link
              to="/login"
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Real Login
            </Link>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Test Backend & Login" to start.</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    result.status === 'SUCCESS' ? 'border-green-500 bg-green-50' :
                    result.status === 'FAILED' ? 'border-red-500 bg-red-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{result.test}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                        result.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.status}
                      </span>
                    </div>
                    {result.details && (
                      <pre className="text-sm text-gray-700 bg-white p-2 rounded overflow-x-auto">
                        {typeof result.details === 'object' ? 
                          JSON.stringify(result.details, null, 2) : 
                          result.details
                        }
                      </pre>
                    )}
                    <div className="text-xs text-gray-500 mt-2">{result.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting Guide</h2>
          <div className="space-y-2 text-yellow-700">
            <p><strong>If Backend Health Check fails:</strong> Make sure your backend server is running on localhost:8000</p>
            <p><strong>If Proxy Connection fails:</strong> Check if setupProxy.js is configured correctly</p>
            <p><strong>If Login fails with 404:</strong> The login endpoint might not exist or have a different path</p>
            <p><strong>If Login fails with 401:</strong> Check if the username/password is correct in your database</p>
            <p><strong>Emergency Solution:</strong> Use "Simulate Successful Login" to test the app without backend</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginDebug;