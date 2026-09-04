#!/usr/bin/env node
/**
 * HAWASSA MESOB SYSTEM HEALTH CHECK
 * 
 * This script tests critical system connections before submission.
 * Run: node test-system-health.js
 */

const https = require('https');
const http = require('http');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Helper: Make HTTP request
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsedBody, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test function
async function test(name, testFn) {
  process.stdout.write(`Testing: ${name}... `);
  
  try {
    const result = await testFn();
    
    if (result.pass) {
      console.log(`${colors.green}✓ PASS${colors.reset}`);
      if (result.message) console.log(`  ${colors.green}${result.message}${colors.reset}`);
      results.passed++;
      results.tests.push({ name, status: 'PASS', message: result.message });
    } else if (result.warning) {
      console.log(`${colors.yellow}⚠ WARNING${colors.reset}`);
      console.log(`  ${colors.yellow}${result.message}${colors.reset}`);
      results.warnings++;
      results.tests.push({ name, status: 'WARNING', message: result.message });
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset}`);
      console.log(`  ${colors.red}${result.message}${colors.reset}`);
      results.failed++;
      results.tests.push({ name, status: 'FAIL', message: result.message });
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR${colors.reset}`);
    console.log(`  ${colors.red}${error.message}${colors.reset}`);
    results.failed++;
    results.tests.push({ name, status: 'ERROR', message: error.message });
  }
}

// Main test suite
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('  HAWASSA MESOB SYSTEM HEALTH CHECK');
  console.log('='.repeat(70) + '\n');

  console.log(`${colors.blue}Backend URL:${colors.reset} ${BACKEND_URL}`);
  console.log(`${colors.blue}Frontend URL:${colors.reset} ${FRONTEND_URL}\n`);

  // ========== BACKEND TESTS ==========
  console.log(`\n${colors.blue}━━━ BACKEND API TESTS ━━━${colors.reset}\n`);

  await test('Backend server is running', async () => {
    try {
      const res = await makeRequest(`${BACKEND_URL}/api/health`);
      return {
        pass: res.status === 200,
        message: res.status === 200 ? 'Server responding' : `Status: ${res.status}`
      };
    } catch {
      return { pass: false, message: 'Backend server not reachable. Start with: cd backend && npm start' };
    }
  });

  await test('Database connection', async () => {
    try {
      const res = await makeRequest(`${BACKEND_URL}/api/institutions`);
      return {
        pass: res.status === 200 && res.data.success,
        message: res.status === 200 ? `Database connected` : `Status: ${res.status}`
      };
    } catch (error) {
      return { pass: false, message: 'Database connection failed' };
    }
  });

  await test('12 Institutions loaded', async () => {
    try {
      const res = await makeRequest(`${BACKEND_URL}/api/institutions`);
      const count = res.data.data?.length || 0;
      return {
        pass: count === 12,
        warning: count > 0 && count !== 12,
        message: count === 12 ? '12 institutions found' : `Found ${count} institutions (expected 12)`
      };
    } catch (error) {
      return { pass: false, message: 'Could not fetch institutions' };
    }
  });

  await test('Authentication endpoint', async () => {
    try {
      const res = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
        email: 'superadmin@mesobcenter.et',
        password: 'super123'
      });
      return {
        pass: res.status === 200 && res.data.success && res.data.token,
        message: res.data.success ? 'Login successful, token received' : res.data.message
      };
    } catch (error) {
      return { pass: false, message: 'Auth endpoint failed' };
    }
  });

  let authToken = null;
  try {
    const res = await makeRequest(`${BACKEND_URL}/api/auth/login`, 'POST', {
      email: 'superadmin@mesobcenter.et',
      password: 'super123'
    });
    authToken = res.data.token;
  } catch (e) {
    // Ignore
  }

  if (authToken) {
    await test('Users endpoint (protected)', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/users`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200 && res.data.success,
          message: `Found ${res.data.data?.length || 0} users`
        };
      } catch (error) {
        return { pass: false, message: 'Protected endpoint failed' };
      }
    });

    await test('Queue endpoint', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/queue/tickets`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200 || res.status === 404,
          message: res.status === 200 ? `${res.data.data?.length || 0} tickets` : 'No tickets (expected for new system)'
        };
      } catch (error) {
        return { pass: false, message: 'Queue endpoint failed' };
      }
    });

    await test('Applications endpoint', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/applications`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200,
          message: `${res.data.data?.length || 0} applications`
        };
      } catch (error) {
        return { pass: false, message: 'Applications endpoint failed' };
      }
    });

    await test('Maintenance reports endpoint', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/maintenance/reports`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200,
          message: `${res.data.data?.length || 0} maintenance reports`
        };
      } catch (error) {
        return { pass: false, message: 'Maintenance endpoint failed' };
      }
    });

    await test('Announcements endpoint', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/announcements`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200,
          message: `${res.data.data?.length || 0} announcements`
        };
      } catch (error) {
        return { pass: false, message: 'Announcements endpoint failed' };
      }
    });

    await test('Feedback endpoint', async () => {
      try {
        const res = await makeRequest(`${BACKEND_URL}/api/feedback`, 'GET', null, {
          'Authorization': `Bearer ${authToken}`
        });
        return {
          pass: res.status === 200,
          message: `${res.data.data?.length || 0} feedback entries`
        };
      } catch (error) {
        return { pass: false, message: 'Feedback endpoint failed' };
      }
    });
  }

  // ========== FRONTEND TESTS ==========
  console.log(`\n${colors.blue}━━━ FRONTEND TESTS ━━━${colors.reset}\n`);

  await test('Frontend server is running', async () => {
    try {
      const res = await makeRequest(FRONTEND_URL);
      return {
        pass: res.status === 200,
        message: res.status === 200 ? 'Frontend accessible' : `Status: ${res.status}`
      };
    } catch {
      return { 
        pass: false, 
        warning: true,
        message: 'Frontend dev server not running. Build with: cd frontend && npm run build' 
      };
    }
  });

  await test('Static assets built', async () => {
    const fs = require('fs');
    const path = require('path');
    const distPath = path.join(__dirname, 'frontend', 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const assetsPath = path.join(distPath, 'assets');

    try {
      if (!fs.existsSync(distPath)) {
        return { 
          pass: false, 
          message: 'dist/ folder not found. Build with: cd frontend && npm run build' 
        };
      }

      if (!fs.existsSync(indexPath)) {
        return { pass: false, message: 'index.html not found in dist/' };
      }

      if (!fs.existsSync(assetsPath)) {
        return { pass: false, message: 'assets/ folder not found in dist/' };
      }

      const assets = fs.readdirSync(assetsPath);
      const jsFiles = assets.filter(f => f.endsWith('.js')).length;
      const cssFiles = assets.filter(f => f.endsWith('.css')).length;

      return {
        pass: jsFiles > 0 && cssFiles > 0,
        message: `${jsFiles} JS files, ${cssFiles} CSS files`
      };
    } catch (error) {
      return { pass: false, message: error.message };
    }
  });

  // ========== ROLE DASHBOARDS ==========
  console.log(`\n${colors.blue}━━━ ROLE DASHBOARD FILES ━━━${colors.reset}\n`);

  const dashboards = [
    'SuperAdminDashboard',
    'MesobManagerDashboard',
    'InstitutionManagerDashboard',
    'EmployeeDashboard',
    'ICTStaffDashboard',
    'CitizenDashboard'
  ];

  for (const dashboard of dashboards) {
    await test(`${dashboard} component exists`, async () => {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboard', `${dashboard}.jsx`);
      
      return {
        pass: fs.existsSync(filePath),
        message: fs.existsSync(filePath) ? 'Component found' : 'Component file missing'
      };
    });
  }

  // ========== RESULTS ==========
  console.log('\n' + '='.repeat(70));
  console.log('  TEST RESULTS');
  console.log('='.repeat(70) + '\n');

  console.log(`${colors.green}✓ Passed:${colors.reset}   ${results.passed}`);
  console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${results.warnings}`);
  console.log(`${colors.red}✗ Failed:${colors.reset}   ${results.failed}`);
  console.log(`  Total:    ${results.passed + results.warnings + results.failed}\n`);

  if (results.failed === 0 && results.warnings === 0) {
    console.log(`${colors.green}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.green}│  ✅ ALL TESTS PASSED - SYSTEM READY FOR SUBMISSION!  │${colors.reset}`);
    console.log(`${colors.green}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
    process.exit(0);
  } else if (results.failed === 0) {
    console.log(`${colors.yellow}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.yellow}│  ⚠  TESTS PASSED WITH WARNINGS - CHECK WARNINGS ABOVE  │${colors.reset}`);
    console.log(`${colors.yellow}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.red}│  ✗ TESTS FAILED - FIX ERRORS ABOVE BEFORE SUBMISSION   │${colors.reset}`);
    console.log(`${colors.red}└─────────────────────────────────────────────────────────────┘${colors.reset}\n`);
    
    console.log(`${colors.yellow}Failed Tests:${colors.reset}`);
    results.tests
      .filter(t => t.status === 'FAIL' || t.status === 'ERROR')
      .forEach(t => {
        console.log(`  • ${t.name}: ${t.message}`);
      });
    console.log('');
    
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
