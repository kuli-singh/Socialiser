
const fetch = require('node-fetch');

async function testLoginAndActivities() {
  try {
    console.log('Testing login and activities page...');
    
    // First, get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF Token:', csrfData.csrfToken);
    
    // Login with test credentials
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'john@doe.com',
        password: 'johndoe123',
        csrfToken: csrfData.csrfToken
      }),
      redirect: 'manual'
    });
    
    console.log('Login Response Status:', loginResponse.status);
    console.log('Login Response Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    // Check if we got a session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies:', cookies);
    
    if (loginResponse.status === 302) {
      console.log('Login redirect successful');
      
      // Try to access activities page (this will show if auth is working)
      const activitiesResponse = await fetch('http://localhost:3000/api/activities', {
        headers: {
          'Cookie': cookies || ''
        }
      });
      
      console.log('Activities API Status:', activitiesResponse.status);
      
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        console.log('Number of activities found:', activitiesData.length);
        console.log('First activity:', activitiesData[0] ? activitiesData[0].name : 'None');
      } else {
        console.log('Activities API error:', await activitiesResponse.text());
      }
    } else {
      console.log('Login failed');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testLoginAndActivities();
