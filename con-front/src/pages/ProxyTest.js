import React, { useState } from 'react';

const ProxyTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testProxy = async () => {
    setLoading(true);
    setResult('Testing proxy connection...');
    
    try {
      // First test if we can reach the backend at all
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setResult(`Proxy test result: ${response.status} - ${response.statusText}`);
    } catch (error) {
      setResult(`Proxy test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login API...');
    
    try {
      const response = await fetch('/api/user-sessions/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'password123',
          ip_address: '127.0.0.1',
          user_agent: navigator.userAgent
        })
      });
      
      const data = await response.text(); // Get as text first
      setResult(`Login test result: ${response.status} - ${data}`);
    } catch (error) {
      setResult(`Login test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">API Connection Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testProxy}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Proxy Connection'}
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Login API'}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-medium mb-2">Result:</h3>
          <pre className="text-sm">{result}</pre>
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Expected:</strong></p>
          <p>• Backend running on port 8000</p>
          <p>• CORS configured to allow localhost:8989</p>
          <p>• API endpoint: /api/user-sessions/login</p>
        </div>
      </div>
    </div>
  );
};

export default ProxyTest;
