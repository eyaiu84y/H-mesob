/**
 * FULL API TEST SUITE FOR HAWASSA MESOB
 * Tests all backend REST endpoints across authentication, RBAC, services,
 * institutions, applications, queues, feedback, announcements, notifications,
 * maintenance, dashboards, and approvals.
 */

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const pass = (title, detail = '') => {
  totalTests++;
  passedTests++;
  console.log(`  ✅ [PASS] ${title}${detail ? ` - ${detail}` : ''}`);
};

const fail = (title, detail = '') => {
  totalTests++;
  failedTests++;
  console.log(`  ❌ [FAIL] ${title}${detail ? `: ${detail}` : ''}`);
};

const banner = (title) => {
  console.log('\n' + '='.repeat(70));
  console.log(` ${title}`);
  console.log('='.repeat(70));
};

async function runApiTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║             HAWASSA MESOB — FULL API TEST SUITE              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // =========================================================================
  // 1. HEALTH CHECK
  // =========================================================================
  banner('1. SYSTEM HEALTH API');
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.status === 'healthy') {
      pass('GET /api/health', `Backend is running (Uptime: ${Math.round(data.uptime)}s, DB: connected)`);
    } else {
      fail('GET /api/health', JSON.stringify(data));
    }
  } catch (err) {
    fail('GET /api/health error', err.message);
  }

  // =========================================================================
  // 2. AUTHENTICATION & RBAC APIS
  // =========================================================================
  banner('2. AUTHENTICATION & RBAC APIS');
  const tokens = {};
  const users = {
    SUPER_ADMIN: { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026' },
    EMPLOYEE: { email: 'employee@mesobcenter.et', password: 'Employee@2026' },
    CITIZEN: { email: 'customer@mesobcenter.et', password: 'customer@2026' },
    TECHNICIAN: { email: 'tech@mesobcenter.et', password: 'tech@2026' }
  };

  for (const [role, creds] of Object.entries(users)) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.accessToken) {
        tokens[role] = data.data.accessToken;
        pass(`POST /api/auth/login as ${role}`, `Token received (Expires: ${data.data.expiresIn || '24h'})`);
      } else {
        fail(`POST /api/auth/login as ${role}`, data.message);
      }
    } catch (err) {
      fail(`POST /api/auth/login as ${role} error`, err.message);
    }
  }

  // Test Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@mesobcenter.et', password: 'InvalidPassword123!' })
    });
    const data = await res.json();
    if (res.status === 401 && !data.success) {
      pass('POST /api/auth/login with invalid password', 'Correctly rejected with HTTP 401');
    } else {
      fail('POST /api/auth/login invalid credentials was not rejected', JSON.stringify(data));
    }
  } catch (err) {
    fail('POST /api/auth/login invalid test error', err.message);
  }

  // Test Profile (GET /api/auth/me) for each role
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const user = data.data?.user || data.data;
      if (res.ok && data.success && user) {
        pass(`GET /api/auth/me as ${role}`, `User: ${user.email}, Role: ${user.role}`);
      } else {
        fail(`GET /api/auth/me as ${role}`, data.message);
      }
    } catch (err) {
      fail(`GET /api/auth/me as ${role} error`, err.message);
    }
  }

  // Verify Token Endpoint
  if (tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('POST /api/auth/verify-token', 'Token verified successfully');
      } else {
        fail('POST /api/auth/verify-token', data.message);
      }
    } catch (err) {
      fail('POST /api/auth/verify-token error', err.message);
    }
  }

  // =========================================================================
  // 3. INSTITUTIONS API
  // =========================================================================
  banner('3. INSTITUTIONS API');
  let sampleInstitutionId = null;
  try {
    const res = await fetch(`${BASE_URL}/institutions`);
    const data = await res.json();
    const insts = data.data || [];
    if (res.ok && data.success && insts.length > 0) {
      sampleInstitutionId = insts[0].id;
      pass('GET /api/institutions', `Retrieved ${insts.length} institutions (e.g. ${insts[0].name_en})`);
    } else {
      fail('GET /api/institutions', data.message || 'No institutions returned');
    }
  } catch (err) {
    fail('GET /api/institutions error', err.message);
  }

  if (sampleInstitutionId) {
    try {
      const res = await fetch(`${BASE_URL}/institutions/${sampleInstitutionId}`);
      const data = await res.json();
      if (res.ok && data.success && data.data?.id === sampleInstitutionId) {
        pass('GET /api/institutions/:id', `Retrieved single institution: ${data.data.name_en}`);
      } else {
        fail('GET /api/institutions/:id', data.message);
      }
    } catch (err) {
      fail('GET /api/institutions/:id error', err.message);
    }
  }

  // =========================================================================
  // 4. SERVICES API
  // =========================================================================
  banner('4. SERVICES API');
  let sampleServiceId = null;
  try {
    const res = await fetch(`${BASE_URL}/services`);
    const data = await res.json();
    const services = data.data || [];
    if (res.ok && data.success && services.length > 0) {
      sampleServiceId = services[0].id;
      const title = services[0].title_en || services[0].name || 'Service';
      pass('GET /api/services', `Retrieved ${services.length} services (e.g. ${title})`);
    } else {
      fail('GET /api/services', data.message);
    }
  } catch (err) {
    fail('GET /api/services error', err.message);
  }

  // Search Services
  try {
    const res = await fetch(`${BASE_URL}/services?search=National`);
    const data = await res.json();
    if (res.ok && data.success) {
      pass('GET /api/services?search=National', `Search returned ${(data.data || []).length} match(es)`);
    } else {
      fail('GET /api/services?search=National', data.message);
    }
  } catch (err) {
    fail('GET /api/services?search error', err.message);
  }

  // Single Service Details
  if (sampleServiceId) {
    try {
      const res = await fetch(`${BASE_URL}/services/${sampleServiceId}`);
      const data = await res.json();
      const s = data.data;
      if (res.ok && data.success && s?.id === sampleServiceId) {
        pass('GET /api/services/:id', `Retrieved service: ${s.title_en || s.name || s.id}`);
      } else {
        fail('GET /api/services/:id', data.message);
      }
    } catch (err) {
      fail('GET /api/services/:id error', err.message);
    }
  }

  // =========================================================================
  // 5. APPLICATIONS API & WORKFLOW
  // =========================================================================
  banner('5. APPLICATIONS API & WORKFLOW');
  let sampleAppId = null;
  if (tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/applications`, {
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const apps = data.data || [];
        if (apps.length > 0) sampleAppId = apps[0].id;
        pass('GET /api/applications as CITIZEN', `Found ${apps.length} user application(s)`);
      } else {
        fail('GET /api/applications as CITIZEN', data.message);
      }
    } catch (err) {
      fail('GET /api/applications error', err.message);
    }
  }

  if (tokens.SUPER_ADMIN) {
    try {
      const res = await fetch(`${BASE_URL}/applications`, {
        headers: { 'Authorization': `Bearer ${tokens.SUPER_ADMIN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/applications as SUPER_ADMIN', `Found ${(data.data || []).length} total system applications`);
      } else {
        fail('GET /api/applications as SUPER_ADMIN', data.message);
      }
    } catch (err) {
      fail('GET /api/applications as SUPER_ADMIN error', err.message);
    }
  }

  if (sampleAppId && tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/applications/${sampleAppId}`, {
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.id === sampleAppId) {
        pass('GET /api/applications/:id', `App #${data.data.application_number}, Status: ${data.data.status}`);
      } else {
        fail('GET /api/applications/:id', data.message);
      }
    } catch (err) {
      fail('GET /api/applications/:id error', err.message);
    }
  }

  // =========================================================================
  // 6. QUEUES API
  // =========================================================================
  banner('6. QUEUES API');
  if (tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/queues`, {
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/queues as CITIZEN', `Found ${(data.data || []).length} active queue tickets`);
      } else {
        fail('GET /api/queues as CITIZEN', data.message);
      }
    } catch (err) {
      fail('GET /api/queues error', err.message);
    }
  }

  if (tokens.SUPER_ADMIN) {
    try {
      const res = await fetch(`${BASE_URL}/queues`, {
        headers: { 'Authorization': `Bearer ${tokens.SUPER_ADMIN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/queues as SUPER_ADMIN', `Super Admin viewing all queues: ${(data.data || []).length} entries`);
      } else {
        fail('GET /api/queues as SUPER_ADMIN', data.message);
      }
    } catch (err) {
      fail('GET /api/queues as SUPER_ADMIN error', err.message);
    }
  }

  // =========================================================================
  // 7. ANNOUNCEMENTS API
  // =========================================================================
  banner('7. ANNOUNCEMENTS API');
  try {
    const res = await fetch(`${BASE_URL}/announcements`);
    const data = await res.json();
    if (res.ok && data.success) {
      pass('GET /api/announcements', `Retrieved ${(data.data || []).length} public announcement(s)`);
    } else {
      fail('GET /api/announcements', data.message);
    }
  } catch (err) {
    fail('GET /api/announcements error', err.message);
  }

  // =========================================================================
  // 8. NOTIFICATIONS API
  // =========================================================================
  banner('8. NOTIFICATIONS API');
  if (tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/notifications as CITIZEN', `Retrieved ${(data.data || []).length} user notification(s)`);
      } else {
        fail('GET /api/notifications as CITIZEN', data.message);
      }
    } catch (err) {
      fail('GET /api/notifications error', err.message);
    }
  }

  if (tokens.EMPLOYEE) {
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${tokens.EMPLOYEE}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/notifications as EMPLOYEE', `Retrieved ${(data.data || []).length} employee notification(s)`);
      } else {
        fail('GET /api/notifications as EMPLOYEE', data.message);
      }
    } catch (err) {
      fail('GET /api/notifications as EMPLOYEE error', err.message);
    }
  }

  // =========================================================================
  // 9. FEEDBACK API
  // =========================================================================
  banner('9. FEEDBACK API');
  if (tokens.CITIZEN) {
    try {
      const res = await fetch(`${BASE_URL}/feedback/my-feedback`, {
        headers: { 'Authorization': `Bearer ${tokens.CITIZEN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/feedback/my-feedback as CITIZEN', `Retrieved ${(data.data || []).length} submitted feedback entry/entries`);
      } else {
        fail('GET /api/feedback/my-feedback as CITIZEN', data.message);
      }
    } catch (err) {
      fail('GET /api/feedback/my-feedback error', err.message);
    }
  }

  if (tokens.SUPER_ADMIN) {
    try {
      const res = await fetch(`${BASE_URL}/feedback`, {
        headers: { 'Authorization': `Bearer ${tokens.SUPER_ADMIN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/feedback as SUPER_ADMIN', `Total feedback records: ${(data.data || []).length}`);
      } else {
        fail('GET /api/feedback as SUPER_ADMIN', data.message);
      }
    } catch (err) {
      fail('GET /api/feedback as SUPER_ADMIN error', err.message);
    }
  }

  // Submit test feedback
  if (tokens.CITIZEN && sampleInstitutionId && sampleServiceId) {
    try {
      const feedbackPayload = {
        institution_id: sampleInstitutionId,
        service_id: sampleServiceId,
        rating: 5,
        comment: 'Excellent, fast service experience at Hawassa MESOB Center.'
      };
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.CITIZEN}`
        },
        body: JSON.stringify(feedbackPayload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('POST /api/feedback as CITIZEN', 'Feedback submitted successfully');
      } else {
        fail('POST /api/feedback as CITIZEN', data.message);
      }
    } catch (err) {
      fail('POST /api/feedback error', err.message);
    }
  }

  // =========================================================================
  // 10. MAINTENANCE API
  // =========================================================================
  banner('10. MAINTENANCE API');
  if (tokens.SUPER_ADMIN) {
    try {
      const res = await fetch(`${BASE_URL}/maintenance/reports`, {
        headers: { 'Authorization': `Bearer ${tokens.SUPER_ADMIN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/maintenance/reports as SUPER_ADMIN', `Found ${(data.data || []).length} maintenance report(s)`);
      } else {
        fail('GET /api/maintenance/reports as SUPER_ADMIN', data.message);
      }
    } catch (err) {
      fail('GET /api/maintenance/reports error', err.message);
    }
  }

  if (tokens.TECHNICIAN) {
    try {
      const res = await fetch(`${BASE_URL}/maintenance/my-tasks`, {
        headers: { 'Authorization': `Bearer ${tokens.TECHNICIAN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/maintenance/my-tasks as TECHNICIAN', `Technician retrieved ${(data.data || []).length} task(s)`);
      } else {
        fail('GET /api/maintenance/my-tasks as TECHNICIAN', data.message);
      }
    } catch (err) {
      fail('GET /api/maintenance/my-tasks error', err.message);
    }
  }

  // =========================================================================
  // 11. DASHBOARDS API
  // =========================================================================
  banner('11. DASHBOARDS API');
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const res = await fetch(`${BASE_URL}/dashboards/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        pass(`GET /api/dashboards/me as ${role}`, `Role dashboard stats returned successfully`);
      } else {
        fail(`GET /api/dashboards/me as ${role}`, data.message);
      }
    } catch (err) {
      fail(`GET /api/dashboards/me as ${role} error`, err.message);
    }
  }

  // =========================================================================
  // 12. CENTRAL APPROVALS API
  // =========================================================================
  banner('12. CENTRAL APPROVALS API');
  if (tokens.SUPER_ADMIN) {
    try {
      const res = await fetch(`${BASE_URL}/approvals`, {
        headers: { 'Authorization': `Bearer ${tokens.SUPER_ADMIN}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        pass('GET /api/approvals as SUPER_ADMIN', `Approval queue returned ${(data.data || []).length} pending request(s)`);
      } else {
        fail('GET /api/approvals as SUPER_ADMIN', data.message);
      }
    } catch (err) {
      fail('GET /api/approvals error', err.message);
    }
  }

  // =========================================================================
  // FINAL TEST SUMMARY
  // =========================================================================
  banner('FULL API TEST SUMMARY');
  console.log(`  Total Endpoints Tested: ${totalTests}`);
  console.log(`  Passed:                 ${passedTests}`);
  console.log(`  Failed:                 ${failedTests}`);
  console.log(`  Success Rate:           ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('='.repeat(70) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runApiTests();
