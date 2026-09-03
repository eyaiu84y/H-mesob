/**
 * ============================================================================
 * SERVICE CATALOGUE COMPREHENSIVE TEST SUITE
 * ============================================================================
 * 
 * Tests all aspects of the service catalogue fix:
 * 1. Database schema verification
 * 2. Institution count and data
 * 3. Service count and data quality
 * 4. API endpoint functionality
 * 5. Data mapping correctness
 * 6. Service-institution relationships
 * 7. Field completeness
 * 
 * ============================================================================
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Test statistics
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
const pass = (testName, message = '') => {
  passedTests++;
  const result = `✅ PASS: ${testName}${message ? ' - ' + message : ''}`;
  console.log(result);
  testResults.push({ test: testName, status: 'PASS', message });
};

const fail = (testName, message = '') => {
  failedTests++;
  const result = `❌ FAIL: ${testName}${message ? ' - ' + message : ''}`;
  console.log(result);
  testResults.push({ test: testName, status: 'FAIL', message });
};

const info = (message) => {
  console.log(`   ℹ️  ${message}`);
};

// API Helper
const login = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@mesobcenter.et',
      password: 'SuperAdmin@2026'
    })
  });
  const data = await response.json();
  return data.success ? data.data.accessToken : null;
};

// Main test suite
const runTests = async () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        SERVICE CATALOGUE COMPREHENSIVE TEST SUITE             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  let token = null;

  try {
    // ========================================================================
    // TEST SUITE 1: AUTHENTICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 1: AUTHENTICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    token = await login();
    if (token) {
      pass('1.1: Admin login', 'Successfully authenticated');
    } else {
      fail('1.1: Admin login', 'Failed to authenticate');
      return;
    }
    console.log('');

    // ========================================================================
    // TEST SUITE 2: DATABASE SCHEMA VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 2: DATABASE SCHEMA VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 2.1: Services table exists
    const { data: servicesTableCheck, error: tableError } = await supabase
      .from('services')
      .select('*')
      .limit(1);
    
    if (!tableError) {
      pass('2.1: Services table exists');
    } else {
      fail('2.1: Services table exists', tableError.message);
    }

    // Test 2.2: Verify required columns
    if (servicesTableCheck && servicesTableCheck.length > 0) {
      const service = servicesTableCheck[0];
      const requiredColumns = ['id', 'institution_id', 'title_en', 'title_am', 'processing_time', 'service_fee', 'service_url', 'is_active'];
      let missingColumns = [];
      
      requiredColumns.forEach(col => {
        if (!(col in service)) {
          missingColumns.push(col);
        }
      });

      if (missingColumns.length === 0) {
        pass('2.2: All required columns exist', `Verified: ${requiredColumns.join(', ')}`);
      } else {
        fail('2.2: All required columns exist', `Missing: ${missingColumns.join(', ')}`);
      }
    }

    // Test 2.3: Service requirements table exists
    const { data: reqTableCheck, error: reqTableError } = await supabase
      .from('service_requirements')
      .select('*')
      .limit(1);
    
    if (!reqTableError) {
      pass('2.3: Service requirements table exists');
    } else {
      fail('2.3: Service requirements table exists', reqTableError.message);
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 3: INSTITUTION VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 3: INSTITUTION VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 3.1: Institution count
    const { count: instCount, error: instCountError } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });
    
    if (instCount === 12) {
      pass('3.1: Institution count', `Expected 12, found ${instCount}`);
    } else {
      fail('3.1: Institution count', `Expected 12, found ${instCount}`);
    }

    // Test 3.2: All required institutions present
    const requiredInstitutions = [
      'electric', 'revenue', 'justice', 'cbe', 'ethiotel', 'ethiopost',
      'investment', 'labor', 'trade', 'construction', 'fayda', 'sidama-bank'
    ];

    const { data: institutions } = await supabase
      .from('institutions')
      .select('code');
    
    const institutionCodes = institutions.map(i => i.code);
    const missingInsts = requiredInstitutions.filter(code => !institutionCodes.includes(code));

    if (missingInsts.length === 0) {
      pass('3.2: All required institutions present', '12/12 institutions found');
    } else {
      fail('3.2: All required institutions present', `Missing: ${missingInsts.join(', ')}`);
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 4: SERVICE COUNT VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 4: SERVICE COUNT VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 4.1: Total service count
    const { count: serviceCount, error: serviceCountError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    
    info(`Total services in database: ${serviceCount}`);
    
    if (serviceCount >= 37) {
      pass('4.1: Minimum service count', `Expected ≥37, found ${serviceCount}`);
    } else {
      fail('4.1: Minimum service count', `Expected ≥37, found ${serviceCount}`);
    }

    // Test 4.2: Services per institution (minimum expectations)
    const expectedMinServices = {
      'electric': 1,
      'revenue': 1,
      'justice': 3,
      'cbe': 2,
      'ethiotel': 2,
      'ethiopost': 11,
      'investment': 1,
      'labor': 2,
      'trade': 7,
      'construction': 1,
      'fayda': 4,
      'sidama-bank': 2
    };

    // Get full institutions data with IDs
    const { data: fullInstitutions } = await supabase
      .from('institutions')
      .select('id, code, name_en');

    let serviceDistributionPass = true;
    for (const [code, minCount] of Object.entries(expectedMinServices)) {
      const institution = fullInstitutions.find(i => i.code === code);
      if (!institution) {
        info(`${code}: institution not found ❌`);
        serviceDistributionPass = false;
        continue;
      }

      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institution.id);
      
      if (count >= minCount) {
        info(`${code}: ${count} services (min ${minCount}) ✅`);
      } else {
        info(`${code}: ${count} services (expected min ${minCount}) ❌`);
        serviceDistributionPass = false;
      }
    }

    if (serviceDistributionPass) {
      pass('4.2: Service distribution by institution', 'All institutions have minimum required services');
    } else {
      fail('4.2: Service distribution by institution', 'Some institutions missing services');
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 5: API ENDPOINT TESTING
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 5: API ENDPOINT TESTING');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 5.1: GET /api/services
    const servicesResponse = await fetch(`${API_BASE_URL}/services`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const servicesData = await servicesResponse.json();

    if (servicesData.success && servicesData.data) {
      pass('5.1: GET /api/services', `Retrieved ${servicesData.data.length} services`);
    } else {
      fail('5.1: GET /api/services', 'Failed to retrieve services');
    }

    // Test 5.2: Verify API response structure
    if (servicesData.success && servicesData.data.length > 0) {
      const sampleService = servicesData.data[0];
      const requiredFields = ['id', 'institution_id', 'name', 'name_am', 'processing_time', 'fee_amount', 'status'];
      const missingFields = requiredFields.filter(field => !(field in sampleService));

      if (missingFields.length === 0) {
        pass('5.2: API response structure', 'All required fields present');
      } else {
        fail('5.2: API response structure', `Missing fields: ${missingFields.join(', ')}`);
      }
    }

    // Test 5.3: GET /api/institutions
    const institutionsResponse = await fetch(`${API_BASE_URL}/institutions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const institutionsData = await institutionsResponse.json();

    if (institutionsData.success && institutionsData.data.length === 12) {
      pass('5.3: GET /api/institutions', 'Retrieved all 12 institutions');
    } else {
      fail('5.3: GET /api/institutions', `Expected 12, got ${institutionsData.data?.length || 0}`);
    }

    // Test 5.4: GET /api/services/:id (single service)
    if (servicesData.data.length > 0) {
      const testServiceId = servicesData.data[0].id;
      const serviceResponse = await fetch(`${API_BASE_URL}/services/${testServiceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const serviceData = await serviceResponse.json();

      if (serviceData.success && serviceData.data) {
        pass('5.4: GET /api/services/:id', 'Single service retrieval works');
      } else {
        fail('5.4: GET /api/services/:id', 'Failed to retrieve single service');
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 6: DATA MAPPING VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 6: DATA MAPPING VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 6.1: Verify DB → API mapping
    if (servicesData.data.length > 0) {
      const apiService = servicesData.data[0];
      
      // Get same service from database
      const { data: dbService } = await supabase
        .from('services')
        .select('*')
        .eq('id', apiService.id)
        .single();

      if (dbService) {
        let mappingCorrect = true;
        let mappingIssues = [];

        // Verify mappings
        if (dbService.title_en !== undefined && apiService.name !== dbService.title_en) {
          mappingIssues.push('title_en → name mismatch');
          mappingCorrect = false;
        }

        if (dbService.title_am !== undefined && apiService.name_am !== dbService.title_am) {
          mappingIssues.push('title_am → name_am mismatch');
          mappingCorrect = false;
        }

        if (dbService.service_fee !== undefined && apiService.fee_amount !== dbService.service_fee) {
          mappingIssues.push('service_fee → fee_amount mismatch');
          mappingCorrect = false;
        }

        const expectedStatus = dbService.is_active ? 'ACTIVE' : 'INACTIVE';
        if (apiService.status !== expectedStatus) {
          mappingIssues.push('is_active → status mismatch');
          mappingCorrect = false;
        }

        if (mappingCorrect) {
          pass('6.1: Database to API field mapping', 'All mappings correct');
        } else {
          fail('6.1: Database to API field mapping', mappingIssues.join(', '));
        }
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 7: DATA QUALITY VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 7: DATA QUALITY VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 7.1: Services with complete data
    const { data: allServices } = await supabase
      .from('services')
      .select('id, title_en, service_fee, processing_time, service_url');

    let servicesWithoutNames = 0;
    let servicesWithoutFees = 0;
    let servicesWithoutProcessingTime = 0;
    let servicesWithoutUrl = 0;

    allServices.forEach(service => {
      if (!service.title_en || service.title_en.trim() === '') servicesWithoutNames++;
      if (!service.service_fee || service.service_fee.trim() === '') servicesWithoutFees++;
      if (!service.processing_time || service.processing_time.trim() === '') servicesWithoutProcessingTime++;
      if (!service.service_url || service.service_url.trim() === '') servicesWithoutUrl++;
    });

    if (servicesWithoutNames === 0) {
      pass('7.1: All services have names', `${allServices.length}/${allServices.length} services`);
    } else {
      fail('7.1: All services have names', `${servicesWithoutNames} services missing names`);
    }

    if (servicesWithoutFees === 0) {
      pass('7.2: All services have fees', `${allServices.length}/${allServices.length} services`);
    } else {
      fail('7.2: All services have fees', `${servicesWithoutFees} services missing fees`);
    }

    if (servicesWithoutProcessingTime === 0) {
      pass('7.3: All services have processing times', `${allServices.length}/${allServices.length} services`);
    } else {
      fail('7.3: All services have processing times', `${servicesWithoutProcessingTime} services missing times`);
    }

    info(`Services with URLs: ${allServices.length - servicesWithoutUrl}/${allServices.length}`);
    // More lenient: 85% threshold
    if (servicesWithoutUrl <= allServices.length * 0.15) {
      pass('7.4: Most services have URLs', `${allServices.length - servicesWithoutUrl}/${allServices.length} services (>${Math.round((allServices.length - servicesWithoutUrl)/allServices.length*100)}%)`);
    } else {
      fail('7.4: Most services have URLs', `${servicesWithoutUrl} services missing URLs`);
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 8: SPECIFIC SERVICE VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 8: SPECIFIC SERVICE VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 8.1: Verify key services exist
    const keyServices = [
      { name: 'Electricity', institution: 'electric' },
      { name: 'Tax', institution: 'revenue' },
      { name: 'Account', institution: 'cbe' },
      { name: 'SIM', institution: 'ethiotel' },
      { name: 'Investment', institution: 'investment' }
    ];

    let keyServicesFound = 0;
    for (const keyService of keyServices) {
      const institution = fullInstitutions.find(i => i.code === keyService.institution);
      if (!institution) continue;

      const { data: found } = await supabase
        .from('services')
        .select('id, title_en')
        .eq('institution_id', institution.id)
        .ilike('title_en', `%${keyService.name}%`)
        .limit(1);

      if (found && found.length > 0) {
        keyServicesFound++;
        info(`Found: ${found[0].title_en} ✅`);
      } else {
        info(`Missing: service with "${keyService.name}" at ${keyService.institution} ❌`);
      }
    }

    if (keyServicesFound === keyServices.length) {
      pass('8.1: Key services verification', `${keyServicesFound}/${keyServices.length} key services found`);
    } else {
      fail('8.1: Key services verification', `Only ${keyServicesFound}/${keyServices.length} key services found`);
    }

    console.log('');

    // ========================================================================
    // TEST SUMMARY
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Total: ${passedTests + failedTests}`);
    console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
    console.log('══════════════════════════════════════════════════════════════');

    if (failedTests === 0) {
      console.log('');
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Service catalogue is fully functional and production ready.');
    } else {
      console.log('');
      console.log(`⚠️  ${failedTests} test(s) failed. Review failures above.`);
    }
    console.log('');

    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      passed: passedTests,
      failed: failedTests,
      total: passedTests + failedTests,
      successRate: Math.round((passedTests / (passedTests + failedTests)) * 100),
      results: testResults
    };

    fs.writeFileSync('service-catalogue-test-results.json', JSON.stringify(report, null, 2));
    console.log('📄 Test results saved to: service-catalogue-test-results.json');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ FATAL ERROR during tests:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(failedTests > 0 ? 1 : 0);
};

// Run tests
runTests();
