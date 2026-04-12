/**
 * API Connection Test Utility
 * Use this to verify backend connectivity
 */

import Backend from '../services/backend';

export const testAPIConnection = async () => {
  const results = {
    baseURL: Backend.api || Backend.auth,
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Check if backend is reachable
  try {
    const response = await fetch(Backend.api || Backend.auth);
    results.tests.push({
      name: 'Backend Reachable',
      status: response.ok ? 'PASS' : 'FAIL',
      statusCode: response.status,
      message: response.ok ? 'Backend is responding' : `Backend returned ${response.status}`
    });
  } catch (error) {
    results.tests.push({
      name: 'Backend Reachable',
      status: 'FAIL',
      error: error.message,
      message: 'Cannot connect to backend. Make sure Django server is running.'
    });
  }

  // Test 2: Check authentication endpoint
  try {
    const authURL = (Backend.auth || Backend.api) + Backend.login;
    const response = await fetch(authURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    
    results.tests.push({
      name: 'Auth Endpoint',
      status: response.status === 401 || response.status === 400 ? 'PASS' : 'WARN',
      statusCode: response.status,
      url: authURL,
      message: response.status === 401 || response.status === 400 
        ? 'Auth endpoint is working (invalid credentials expected)' 
        : 'Unexpected response from auth endpoint'
    });
  } catch (error) {
    results.tests.push({
      name: 'Auth Endpoint',
      status: 'FAIL',
      error: error.message
    });
  }

  return results;
};

// Console test function
export const runAPITest = async () => {
  console.log('🔍 Testing API Connection...\n');
  const results = await testAPIConnection();
  
  console.log(`Base URL: ${results.baseURL}`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  results.tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
    if (test.message) console.log(`   ${test.message}`);
    if (test.url) console.log(`   URL: ${test.url}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    console.log('');
  });
  
  return results;
};
