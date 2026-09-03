import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Helper function for API calls
const api = axios.create({ baseURL: API_URL });

// Test 1: Search for institution (e.g., "fayda")
async function test1_searchInstitution() {
  console.log('\n=== TEST 1: Search Institution (fayda) ===');
  try {
    const res = await api.get('/search?q=fayda');
    console.log('✅ Search successful');
    console.log(`   Institutions found: ${res.data.data.institutions.length}`);
    console.log(`   Services found: ${res.data.data.services.length}`);
    console.log(`   Total results: ${res.data.data.total}`);
    if (res.data.data.institutions.length > 0) {
      console.log(`   Sample institution: ${res.data.data.institutions[0].name_en}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Search for service keyword (e.g., "id" or "passport")
async function test2_searchService() {
  console.log('\n=== TEST 2: Search Service (ID) ===');
  try {
    const res = await api.get('/search?q=id');
    console.log('✅ Search successful');
    console.log(`   Institutions found: ${res.data.data.institutions.length}`);
    console.log(`   Services found: ${res.data.data.services.length}`);
    console.log(`   Total results: ${res.data.data.total}`);
    if (res.data.data.services.length > 0) {
      console.log(`   Sample service: ${res.data.data.services[0].name || res.data.data.services[0].title_en}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Search for common keyword
async function test3_searchKeyword() {
  console.log('\n=== TEST 3: Search Keyword (registration) ===');
  try {
    const res = await api.get('/search?q=registration');
    console.log('✅ Search successful');
    console.log(`   Institutions found: ${res.data.data.institutions.length}`);
    console.log(`   Services found: ${res.data.data.services.length}`);
    console.log(`   Requirements found: ${res.data.data.requirements.length}`);
    console.log(`   Total results: ${res.data.data.total}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Empty search (should fail with validation error)
async function test4_emptySearch() {
  console.log('\n=== TEST 4: Empty Search (should fail) ===');
  try {
    await api.get('/search?q=');
    console.error('❌ Empty search was accepted (should have been rejected)');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Empty search correctly rejected (400)');
      console.log(`   Message: ${error.response.data.message}`);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Search too short (less than 2 characters)
async function test5_shortSearch() {
  console.log('\n=== TEST 5: Short Search (1 character - should fail) ===');
  try {
    const res = await api.get('/search?q=a');
    if (res.data.success === false) {
      console.log('✅ Short search correctly rejected');
      console.log(`   Message: ${res.data.message}`);
      return true;
    }
    console.error('❌ Short search was accepted (should have been rejected)');
    return false;
  } catch (error) {
    // Also accept if backend throws error
    if (error.response?.status === 400 && error.response.data.success === false) {
      console.log('✅ Short search correctly rejected (400)');
      console.log(`   Message: ${error.response.data.message}`);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Search with no results
async function test6_noResults() {
  console.log('\n=== TEST 6: Search No Results (xyzabc123) ===');
  try {
    const res = await api.get('/search?q=xyzabc123');
    console.log('✅ Search successful');
    console.log(`   Total results: ${res.data.data.total}`);
    if (res.data.data.total === 0) {
      console.log('   ✓ Correctly returned zero results');
    }
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Search missing query parameter
async function test7_missingParam() {
  console.log('\n=== TEST 7: Missing Query Parameter (should fail) ===');
  try {
    await api.get('/search');
    console.error('❌ Request without query param was accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Missing param correctly rejected (400)');
      console.log(`   Message: ${error.response.data.message}`);
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Search with special characters
async function test8_specialCharacters() {
  console.log('\n=== TEST 8: Search with Special Characters ===');
  try {
    const res = await api.get('/search?q=' + encodeURIComponent('ID@123'));
    console.log('✅ Search with special characters handled');
    console.log(`   Total results: ${res.data.data.total}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       PHASE 7: Backend Search API Tests           ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await test1_searchInstitution());
  results.push(await test2_searchService());
  results.push(await test3_searchKeyword());
  results.push(await test4_emptySearch());
  results.push(await test5_shortSearch());
  results.push(await test6_noResults());
  results.push(await test7_missingParam());
  results.push(await test8_specialCharacters());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
  console.log(results.map((r, i) => `${i + 1}. ${r ? '✅ PASS' : '❌ FAIL'}`).join('\n'));
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Backend search API working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
}

runAllTests();
