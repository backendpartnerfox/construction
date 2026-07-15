import React, { useState, useEffect } from 'react';

const ConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [backendHealth, setBackendHealth] = useState(null);
  const [loginTest, setLoginTest] = useState(null);
  const [detailedLogs, setDetailedLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDetailedLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    addLog('Starting connection tests...');
    setDetailedLogs([]);
    
    // Test 1: Direct backend health endpoint
    try {
      addLog('Testing direct backend connection...');
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendHealth({ status: 'success', data });
        setConnectionStatus('✅ Backend is running');
        addLog('✅ Direct backend connection successful', 'success');
        addLog(`Backend response: ${JSON.stringify(data)}`, 'info');
      } else {
        setBackendHealth({ status: 'error', message: `HTTP ${response.status}` });
        setConnectionStatus('❌ Backend returned error');
        addLog(`❌ Backend returned HTTP ${response.status}`, 'error');
      }
    } catch (error) {
      setBackendHealth({ status: 'error', message: error.message });
      setConnectionStatus('❌ Cannot connect to backend');
      addLog(`❌ Direct backend connection failed: ${error.message}`, 'error');
    }

    // Test 2: Proxy endpoint
    try {
      addLog('Testing proxy connection...');
      const proxyResponse = await fetch('/api/health');
      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        addLog('✅ Proxy connection working', 'success');
        addLog(`Proxy response: ${JSON.stringify(proxyData)}`, 'info');
      } else {
        addLog(`❌ Proxy connection failed with HTTP ${proxyResponse.status}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Proxy connection error: ${error.message}`, 'error');
    }

    // Test 3: Check if tables exist endpoint
    try {
      addLog('Checking database tables...');
      const tablesResponse = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (tablesResponse.ok) {
        addLog('✅ Users table accessible', 'success');
      } else {
        addLog(`❌ Users table check failed: HTTP ${tablesResponse.status}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Database table check error: ${error.message}`, 'error');
    }
  };

  const testLogin = async () => {
    try {
      setLoginTest({ status: 'testing' });
      addLog('Testing login with admin/admin123...');
      
      // Test with direct fetch first
      const loginData = {
        username: 'admin',
        password: 'admin123',
        ip_address: '127.0.0.1',
        user_agent: navigator.userAgent
      };
      
      addLog(`Login payload: ${JSON.stringify(loginData)}`);
      
      const response = await fetch('/api/user-sessions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      addLog(`Login response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        setLoginTest({ status: 'success', data: result });
        addLog('✅ Login successful!', 'success');
        addLog(`Login result: ${JSON.stringify(result, null, 2)}`);
      } else {
        const errorText = await response.text();
        setLoginTest({ status: 'error', error: `HTTP ${response.status}`, details: errorText });
        addLog(`❌ Login failed: HTTP ${response.status}`, 'error');
        addLog(`Error details: ${errorText}`, 'error');
      }
    } catch (error) {
      setLoginTest({ status: 'error', error: error.message });
      addLog(`❌ Login error: ${error.message}`, 'error');
    }
  };

  const testWithDifferentCredentials = async () => {
    const testCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'testuser', password: 'test123' },
      { username: 'admin', password: 'password' }
    ];

    for (const creds of testCredentials) {
      try {
        addLog(`Testing ${creds.username}/${creds.password}...`);
        
        const response = await fetch('/api/user-sessions/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...creds,
            ip_address: '127.0.0.1',
            user_agent: navigator.userAgent
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          addLog(`✅ Login successful with ${creds.username}/${creds.password}`, 'success');
          break;
        } else {
          addLog(`❌ Login failed with ${creds.username}/${creds.password}: HTTP ${response.status}`, 'error');
        }
      } catch (error) {
        addLog(`❌ Error testing ${creds.username}/${creds.password}: ${error.message}`, 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Construction Project - Connection Test</h1>
        
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Backend Connection</h2>
          <div className="flex items-center mb-4">
            <span className="text-gray-600">Status: </span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm ${
              backendHealth?.status === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus}
            </span>
          </div>
          
          {backendHealth && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Health Check Response:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(backendHealth, null, 2)}
              </pre>
            </div>
          )}
          
          <button
            onClick={testConnections}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            Test Connection Again
          </button>
        </div>

        {/* Login Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Login API Test</h2>
          
          {loginTest && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Login Test Result:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(loginTest, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="space-x-2">
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loginTest?.status === 'testing'}
            >
              {loginTest?.status === 'testing' ? 'Testing Login...' : 'Test Login (admin/admin123)'}
            </button>
            
            <button
              onClick={testWithDifferentCredentials}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Try Multiple Credentials
            </button>
          </div>
        </div>

        {/* Detailed Logs */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Detailed Logs</h2>
          <div className="max-h-96 overflow-y-auto bg-black text-green-400 p-4 rounded text-sm font-mono">
            {detailedLogs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
            {detailedLogs.length === 0 && (
              <div className="text-gray-500">No logs yet. Run a test to see detailed output.</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/login" className="block p-4 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
              <h3 className="font-medium text-blue-900">Go to Login Page</h3>
              <p className="text-blue-700 text-sm">Try the actual login form</p>
            </a>
            <a href="http://localhost:8000/api-docs" target="_blank" rel="noopener noreferrer" className="block p-4 bg-green-50 border border-green-200 rounded hover:bg-green-100">
              <h3 className="font-medium text-green-900">Backend API Docs</h3>
              <p className="text-green-700 text-sm">View Swagger documentation</p>
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Make sure PostgreSQL is running on port 5432</li>
            <li>Run the database setup: <code className="bg-yellow-100 px-2 py-1 rounded">cd constructions-be && node setup-and-test.js</code></li>
            <li>Start backend server: <code className="bg-yellow-100 px-2 py-1 rounded">cd constructions-be && npm start</code></li>
            <li>Backend should be accessible at <code className="bg-yellow-100 px-2 py-1 rounded">http://localhost:8000</code></li>
            <li>Default credentials: <strong>admin</strong> / <strong>admin123</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
