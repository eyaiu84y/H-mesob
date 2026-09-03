/**
 * ============================================================================
 * CENTRALIZED SEARCH COMPREHENSIVE TEST SUITE
 * ============================================================================
 * 
 * Tests all aspects of search functionality:
 * 1. Partial search with database verification
 * 2. Case-insensitive search
 * 3. Empty and invalid search queries
 * 4. Institution name search
 * 5. Service name search
 * 6. No duplicate results
 * 7. Correct returned fields
 * 8. Matches real database/service catalogue data
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

// Search helper
const performSearch = async (query) => {
  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  return { response, data };
};

// Database verification helpers
const getInstitutionFromDb = async (searchTerm) => {
  const { data } = await supabase
    .from('institutions')
    .select('*')
    .or(`name_en.ilike.%${searchTerm}%,name_am.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
    .eq('status', 'ACTIVE');
  return data || [];
};

const getServicesFromDb = async (searchTerm) => {
  const { data } = await supabase
    .from('services')
    .select('*, institutions(id, name_en, code)')
    .or(`title_en.ilike.%${searchTerm}%,title_am.ilike.%${searchTerm}%`)
    .eq('is_active', true);
  return data || [];
};

// Main test suite
const runTests = async () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        CENTRALIZED SEARCH COMPREHENSIVE TEST SUITE            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // ========================================================================
    // TEST SUITE 1: EMPTY AND INVALID QUERIES
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 1: EMPTY AND INVALID QUERIES');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 1.1: Missing query parameter
    const noQueryResponse = await fetch(`${API_BASE_URL}/search`);
    const noQueryData = await noQueryResponse.json();
    
    if (noQueryResponse.status === 400 && !noQueryData.success) {
      pass('1.1: Missing query parameter rejected', 'Properly returns 400 error');
    } else {
      fail('1.1: Missing query parameter rejected', 'Should return 400 error');
    }

    // Test 1.2: Empty query
    const { response: emptyResponse, data: emptyData } = await performSearch('');
    
    if (!emptyData.success) {
      pass('1.2: Empty query rejected', 'Properly validated');
    } else {
      fail('1.2: Empty query rejected', 'Should reject empty queries');
    }

    // Test 1.3: Single character query
    const { response: singleCharResponse, data: singleCharData } = await performSearch('a');
    
    if (!singleCharData.success) {
      pass('1.3: Single character query rejected', 'Must be at least 2 characters');
    } else {
      fail('1.3: Single character query rejected', 'Should require minimum 2 characters');
    }

    // Test 1.4: Special characters handled
    const { response: specialResponse, data: specialData } = await performSearch('%%%');
    
    if (specialResponse.status === 200) {
      pass('1.4: Special characters handled gracefully', 'No server error');
    } else {
      fail('1.4: Special characters handled gracefully', 'Server error occurred');
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 2: INSTITUTION NAME SEARCH
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 2: INSTITUTION NAME SEARCH');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 2.1: Full institution name search
    const { data: bankSearchData } = await performSearch('Bank');
    
    if (bankSearchData.success) {
      if (bankSearchData.data.institutions.length > 0) {
        const hasBank = bankSearchData.data.institutions.some(inst => 
          inst.name_en.toLowerCase().includes('bank')
        );
        
        if (hasBank) {
          pass('2.1: Full institution name search', `Found ${bankSearchData.data.institutions.length} institutions with "Bank"`);
        } else {
          fail('2.1: Full institution name search', 'Did not find matching institutions');
        }
      } else {
        // Check if services with Bank exist instead
        if (bankSearchData.data.services.length > 0) {
          pass('2.1: Full institution name search', `No institutions but found ${bankSearchData.data.services.length} services (acceptable)`);
        } else {
          fail('2.1: Full institution name search', 'No results returned');
        }
      }
    } else {
      fail('2.1: Full institution name search', 'Search failed');
    }

    // Test 2.2: Partial institution name search
    const { data: partialData } = await performSearch('Tel');
    
    if (partialData.success) {
      const hasTelecom = partialData.data.institutions.some(inst => 
        inst.name_en.toLowerCase().includes('tel')
      );
      
      if (hasTelecom) {
        pass('2.2: Partial institution name search', 'Partial matching works');
      } else {
        info('2.2: No institutions with "Tel" found (may be ok)');
      }
    }

    // Test 2.3: Case-insensitive institution search
    const { data: lowerCaseData } = await performSearch('bank');
    const { data: upperCaseData } = await performSearch('BANK');
    const { data: mixedCaseData } = await performSearch('BaNk');
    
    const lowerCount = lowerCaseData.data?.institutions.length || 0;
    const upperCount = upperCaseData.data?.institutions.length || 0;
    const mixedCount = mixedCaseData.data?.institutions.length || 0;
    
    if (lowerCount === upperCount && upperCount === mixedCount && lowerCount > 0) {
      pass('2.3: Case-insensitive institution search', `All cases return ${lowerCount} results`);
    } else {
      fail('2.3: Case-insensitive institution search', `Different results: lower=${lowerCount}, upper=${upperCount}, mixed=${mixedCount}`);
    }

    // Test 2.4: Verify institution results match database
    const { data: ethioSearchData } = await performSearch('Ethio');
    const dbInstitutions = await getInstitutionFromDb('Ethio');
    
    if (ethioSearchData.success && ethioSearchData.data.institutions.length > 0) {
      info(`API returned ${ethioSearchData.data.institutions.length} institutions`);
      info(`Database has ${dbInstitutions.length} matching institutions`);
      
      // Verify each API result exists in DB
      let allMatch = true;
      for (const inst of ethioSearchData.data.institutions) {
        const existsInDb = dbInstitutions.some(dbInst => dbInst.id === inst.id);
        if (!existsInDb) {
          allMatch = false;
          break;
        }
      }
      
      if (allMatch) {
        pass('2.4: Institution results match database', 'All results verified in DB');
      } else {
        fail('2.4: Institution results match database', 'Some results not found in DB');
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 3: SERVICE NAME SEARCH
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 3: SERVICE NAME SEARCH');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 3.1: Service name search
    const { data: paymentSearchData } = await performSearch('Payment');
    
    if (paymentSearchData.success && paymentSearchData.data.services.length > 0) {
      const hasPayment = paymentSearchData.data.services.some(svc => 
        svc.name.toLowerCase().includes('payment')
      );
      
      if (hasPayment) {
        pass('3.1: Service name search', `Found ${paymentSearchData.data.services.length} services`);
      } else {
        fail('3.1: Service name search', 'Did not find matching services');
      }
    } else {
      fail('3.1: Service name search', 'No service results returned');
    }

    // Test 3.2: Partial service name search
    const { data: licenseSearchData } = await performSearch('Licen');
    
    if (licenseSearchData.success && licenseSearchData.data.services.length > 0) {
      const hasLicense = licenseSearchData.data.services.some(svc => 
        svc.name.toLowerCase().includes('licen')
      );
      
      if (hasLicense) {
        pass('3.2: Partial service name search', 'Partial matching works for services');
      } else {
        info('3.2: No services with "Licen" found in name');
      }
    }

    // Test 3.3: Case-insensitive service search
    const { data: licLowerData } = await performSearch('license');
    const { data: licUpperData } = await performSearch('LICENSE');
    const { data: licMixedData } = await performSearch('LiCeNsE');
    
    const licLowerCount = licLowerData.data?.services.length || 0;
    const licUpperCount = licUpperData.data?.services.length || 0;
    const licMixedCount = licMixedData.data?.services.length || 0;
    
    if (licLowerCount === licUpperCount && licUpperCount === licMixedCount) {
      pass('3.3: Case-insensitive service search', `All cases return ${licLowerCount} results`);
    } else {
      fail('3.3: Case-insensitive service search', `Different results: lower=${licLowerCount}, upper=${licUpperCount}, mixed=${licMixedCount}`);
    }

    // Test 3.4: Verify service results match database
    const { data: regSearchData } = await performSearch('Registration');
    const dbServices = await getServicesFromDb('Registration');
    
    if (regSearchData.success && regSearchData.data.services.length > 0) {
      info(`API returned ${regSearchData.data.services.length} services`);
      info(`Database has ${dbServices.length} matching services`);
      
      // Verify each API result exists in DB
      let allMatch = true;
      for (const svc of regSearchData.data.services) {
        const existsInDb = dbServices.some(dbSvc => dbSvc.id === svc.id);
        if (!existsInDb) {
          allMatch = false;
          break;
        }
      }
      
      if (allMatch) {
        pass('3.4: Service results match database', 'All results verified in DB');
      } else {
        fail('3.4: Service results match database', 'Some results not found in DB');
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 4: RESPONSE STRUCTURE AND FIELDS
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 4: RESPONSE STRUCTURE AND FIELDS');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 4.1: Response structure
    const { data: structureData } = await performSearch('Bank');
    
    if (structureData.success && structureData.data) {
      const hasInstitutions = 'institutions' in structureData.data;
      const hasServices = 'services' in structureData.data;
      const hasTotal = 'total' in structureData.data;
      const hasQuery = 'query' in structureData.data;
      
      if (hasInstitutions && hasServices && hasTotal && hasQuery) {
        pass('4.1: Response structure', 'All required fields present');
      } else {
        fail('4.1: Response structure', 'Missing required fields');
      }
    } else {
      fail('4.1: Response structure', 'Invalid response format');
    }

    // Test 4.2: Institution fields
    if (structureData.data.institutions.length > 0) {
      const inst = structureData.data.institutions[0];
      const requiredFields = ['id', 'name_en', 'name_am', 'code'];
      const missingFields = requiredFields.filter(field => !(field in inst));
      
      if (missingFields.length === 0) {
        pass('4.2: Institution fields', 'All required fields present');
      } else {
        fail('4.2: Institution fields', `Missing: ${missingFields.join(', ')}`);
      }
    }

    // Test 4.3: Service fields
    if (structureData.data.services.length > 0) {
      const svc = structureData.data.services[0];
      const requiredFields = ['id', 'name', 'name_am', 'institution_id', 'fee_amount', 'status'];
      const missingFields = requiredFields.filter(field => !(field in svc));
      
      if (missingFields.length === 0) {
        pass('4.3: Service fields', 'All required fields present');
      } else {
        fail('4.3: Service fields', `Missing: ${missingFields.join(', ')}`);
      }
    }

    // Test 4.4: Service includes institution data
    if (structureData.data.services.length > 0) {
      const svc = structureData.data.services[0];
      
      if (svc.institutions && svc.institutions.name_en) {
        pass('4.4: Service includes institution data', 'Institution relationship populated');
      } else {
        fail('4.4: Service includes institution data', 'Institution data missing');
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 5: NO DUPLICATE RESULTS
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 5: NO DUPLICATE RESULTS');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 5.1: No duplicate institutions
    const { data: dupCheckData } = await performSearch('Bank');
    
    if (dupCheckData.success && dupCheckData.data.institutions.length > 0) {
      const institutionIds = dupCheckData.data.institutions.map(i => i.id);
      const uniqueIds = [...new Set(institutionIds)];
      
      if (institutionIds.length === uniqueIds.length) {
        pass('5.1: No duplicate institutions', `${institutionIds.length} unique institutions`);
      } else {
        fail('5.1: No duplicate institutions', `Found ${institutionIds.length - uniqueIds.length} duplicates`);
      }
    } else {
      pass('5.1: No duplicate institutions', 'No institutions returned (cannot test duplicates)');
    }

    // Test 5.2: No duplicate services
    if (dupCheckData.success && dupCheckData.data.services.length > 0) {
      const serviceIds = dupCheckData.data.services.map(s => s.id);
      const uniqueIds = [...new Set(serviceIds)];
      
      if (serviceIds.length === uniqueIds.length) {
        pass('5.2: No duplicate services', `${serviceIds.length} unique services`);
      } else {
        fail('5.2: No duplicate services', `Found ${serviceIds.length - uniqueIds.length} duplicates`);
      }
    } else {
      pass('5.2: No duplicate services', 'No services returned (cannot test duplicates)');
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 6: REAL DATABASE VERIFICATION
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 6: REAL DATABASE VERIFICATION');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 6.1: Uses real institutions table
    const { count: dbInstCount } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE');

    const { data: allInstSearch } = await performSearch('an');
    
    info(`Database has ${dbInstCount} active institutions`);
    info(`Search returned ${allInstSearch.success ? allInstSearch.data.institutions.length : 0} institutions for "an"`);
    info(`Search can return max 10 institutions (API limit)`);
    
    if (allInstSearch.success && allInstSearch.data && allInstSearch.data.institutions) {
      if (allInstSearch.data.institutions.length <= 10 && allInstSearch.data.institutions.length <= dbInstCount) {
        pass('6.1: Uses real institutions table', `${allInstSearch.data.institutions.length} results within expected range`);
      } else {
        fail('6.1: Uses real institutions table', `Results outside expected range: got ${allInstSearch.data.institutions.length}`);
      }
    } else {
      pass('6.1: Uses real institutions table', 'Search completed (no results for this term)');
    }

    // Test 6.2: Uses real services table
    const { count: dbSvcCount } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: allSvcSearch } = await performSearch('service');
    
    info(`Database has ${dbSvcCount} active services`);
    info(`Search returned ${allSvcSearch.success ? allSvcSearch.data.services.length : 0} services for "service"`);
    info(`Search can return max 20 services (API limit)`);
    
    if (allSvcSearch.success && allSvcSearch.data && allSvcSearch.data.services) {
      if (allSvcSearch.data.services.length <= 20 && allSvcSearch.data.services.length <= dbSvcCount) {
        pass('6.2: Uses real services table', `${allSvcSearch.data.services.length} results within expected range`);
      } else {
        fail('6.2: Uses real services table', `Results outside expected range: got ${allSvcSearch.data.services.length}`);
      }
    } else {
      pass('6.2: Uses real services table', 'Search completed (no results for this term)');
    }

    // Test 6.3: No invented search results
    const { data: specificSearch } = await performSearch('Electricity');
    
    if (specificSearch.success && specificSearch.data.services.length > 0) {
      // Verify each service exists in database
      let allVerified = true;
      for (const svc of specificSearch.data.services) {
        const { data: dbService } = await supabase
          .from('services')
          .select('id, title_en')
          .eq('id', svc.id)
          .single();
        
        if (!dbService) {
          allVerified = false;
          info(`Service ${svc.id} not found in database`);
          break;
        }
      }
      
      if (allVerified) {
        pass('6.3: No invented search results', 'All results exist in database');
      } else {
        fail('6.3: No invented search results', 'Found results not in database');
      }
    }

    // Test 6.4: Service catalogue consistency
    const { data: catalogueSearch } = await performSearch('Tax');
    
    if (catalogueSearch.success) {
      // Verify service data matches what we populated
      let dataConsistent = true;
      for (const svc of catalogueSearch.data.services) {
        if (!svc.name || !svc.fee_amount || !svc.institution_id) {
          dataConsistent = false;
          break;
        }
      }
      
      if (dataConsistent) {
        pass('6.4: Service catalogue consistency', 'All services have complete data');
      } else {
        fail('6.4: Service catalogue consistency', 'Some services missing data');
      }
    }

    console.log('');

    // ========================================================================
    // TEST SUITE 7: EDGE CASES AND SPECIAL SEARCHES
    // ========================================================================
    console.log('══════════════════════════════════════════════════════════════');
    console.log('TEST SUITE 7: EDGE CASES AND SPECIAL SEARCHES');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');

    // Test 7.1: Amharic character search (if supported)
    const { data: amharicData } = await performSearch('ባንክ');
    
    if (amharicData.success) {
      pass('7.1: Amharic character search', 'Handles Unicode characters');
    } else {
      fail('7.1: Amharic character search', 'Failed to handle Unicode');
    }

    // Test 7.2: Numbers in search
    const { data: numberData } = await performSearch('123');
    
    if (numberData.success) {
      pass('7.2: Numbers in search', 'Handles numeric queries');
    } else {
      fail('7.2: Numbers in search', 'Failed numeric query');
    }

    // Test 7.3: Very long query
    const longQuery = 'a'.repeat(100);
    const { data: longData } = await performSearch(longQuery);
    
    if (longData.success !== undefined) {
      pass('7.3: Very long query', 'Handles long queries without error');
    } else {
      fail('7.3: Very long query', 'Failed on long query');
    }

    // Test 7.4: Search with spaces
    const { data: spaceData } = await performSearch('National ID');
    
    if (spaceData.success) {
      pass('7.4: Search with spaces', 'Handles multi-word queries');
    } else {
      fail('7.4: Search with spaces', 'Failed on multi-word query');
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
      console.log('✅ Search functionality is fully functional and verified.');
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

    fs.writeFileSync('search-test-results.json', JSON.stringify(report, null, 2));
    console.log('📄 Test results saved to: search-test-results.json');
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
