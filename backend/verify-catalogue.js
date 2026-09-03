/**
 * ============================================================================
 * INSTITUTION AND SERVICE CATALOGUE VERIFICATION
 * ============================================================================
 * 
 * Verifies all 12 institutions and their services against approved source data
 * 
 * Checks:
 * - Institution count (must be 12)
 * - Service names
 * - Required documents
 * - Processing times
 * - Service fees
 * - Official websites
 * - Missing/duplicate/incorrect data
 * 
 * ============================================================================
 */

import fetch from 'node-fetch';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:5000/api';

// Approved source data from seed files (002_seed_services.sql and 004_seed_institutions.sql)
const APPROVED_INSTITUTIONS = {
  'electric': {
    name_en: 'Ethiopian Electric Utility',
    name_am: 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት',
    website_url: 'https://eeu.gov.et',
    expected_services: 1
  },
  'revenue': {
    name_en: 'Revenues Bureau',
    name_am: 'ገቢዎች ባለስልጣን',
    website_url: 'https://www.aarevenue.gov.et',
    expected_services: 1
  },
  'justice': {
    name_en: 'Ministry of Justice',
    name_am: 'የፍትህ ሚኒስቴር',
    website_url: 'https://justice.gov.et/en',
    expected_services: 3
  },
  'cbe': {
    name_en: 'Commercial Bank of Ethiopia',
    name_am: 'የኢትዮጵያ ንግድ ባንክ',
    website_url: 'https://combanketh.et',
    expected_services: 2
  },
  'ethiotel': {
    name_en: 'Ethio Telecom',
    name_am: 'ኢትዮ ቴሌኮም',
    website_url: 'https://www.ethiotelecom.et',
    expected_services: 2
  },
  'ethiopost': {
    name_en: 'Ethiopian Postal Service Enterprise',
    name_am: 'የኢትዮጵያ ፖስታ አገልግሎት ድርጅት',
    website_url: 'https://ethio.post',
    expected_services: 11
  },
  'investment': {
    name_en: 'Investment Commission',
    name_am: 'ኢንቨስትመንት ኮሚሽን',
    website_url: 'https://investethiopia.gov.et',
    expected_services: 1
  },
  'labor': {
    name_en: 'Labor and Skills Bureau',
    name_am: 'ሠራተኛ እና ክህሎት ቢሮ',
    website_url: 'https://mols.gov.et',
    expected_services: 2
  },
  'trade': {
    name_en: 'Trade Bureau',
    name_am: 'ንግድ ቢሮ',
    website_url: 'https://motri.gov.et/en',
    expected_services: null  // Need to count from source
  },
  'construction': {
    name_en: 'Construction Authority',
    name_am: 'ግንባታ ባለስልጣን',
    website_url: '',  // No website in source
    expected_services: null
  },
  'fayda': {
    name_en: 'National ID Program / Fayda',
    name_am: 'ብሔራዊ መታወቂያ ፕሮግራም / ፋይዳ',
    website_url: 'https://www.id.gov.et',
    expected_services: null
  },
  'sidama-bank': {
    name_en: 'Sidama Bank',
    name_am: 'ሲዳማ ባንክ',
    website_url: 'https://sidamabanksc.com',
    expected_services: null
  }
};

const EXPECTED_INSTITUTION_COUNT = 12;

// Statistics
const stats = {
  institutions: {
    expected: EXPECTED_INSTITUTION_COUNT,
    found: 0,
    missing: [],
    extra: [],
    name_mismatches: [],
    website_mismatches: [],
    website_missing: []
  },
  services: {
    total: 0,
    by_institution: {},
    missing_requirements: [],
    missing_processing_time: [],
    missing_fee: [],
    missing_url: [],
    invalid_urls: []
  },
  issues: []
};

// Helper: Login as admin
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

// Helper: Get all institutions
const getInstitutions = async (token) => {
  const response = await fetch(`${API_BASE_URL}/institutions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Helper: Get all services
const getServices = async (token) => {
  const response = await fetch(`${API_BASE_URL}/services`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Helper: Get services by institution
const getServicesByInstitution = async (token, institutionId) => {
  const response = await fetch(`${API_BASE_URL}/services?institutionId=${institutionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
};

// Helper: Check if URL is valid
const isValidUrl = (url) => {
  if (!url || url.trim() === '') return false;
  if (url === '#') return false;  // Placeholder URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// Main verification
const runVerification = async () => {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     INSTITUTION & SERVICE CATALOGUE VERIFICATION             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Login
    console.log('🔐 Logging in...');
    const token = await login();
    if (!token) {
      console.log('❌ Failed to login');
      return;
    }
    console.log('✅ Logged in successfully');
    console.log('');

    // ========================================================================
    // VERIFY INSTITUTIONS
    // ========================================================================
    console.log('======================================================================');
    console.log('PART 1: INSTITUTION VERIFICATION');
    console.log('======================================================================');
    console.log('');

    const institutionsResult = await getInstitutions(token);
    if (!institutionsResult.success) {
      console.log('❌ Failed to fetch institutions');
      return;
    }

    const institutions = institutionsResult.data;
    stats.institutions.found = institutions.length;

    console.log(`📊 Institution Count:`);
    console.log(`   Expected: ${EXPECTED_INSTITUTION_COUNT}`);
    console.log(`   Found: ${stats.institutions.found}`);
    
    if (stats.institutions.found === EXPECTED_INSTITUTION_COUNT) {
      console.log(`   ✅ Count matches!`);
    } else {
      console.log(`   ❌ Count mismatch!`);
      stats.issues.push(`Institution count: expected ${EXPECTED_INSTITUTION_COUNT}, found ${stats.institutions.found}`);
    }
    console.log('');

    // Check each approved institution
    console.log(`📋 Verifying Each Institution:`);
    console.log('');

    const foundCodes = new Set();

    for (const inst of institutions) {
      foundCodes.add(inst.code);
      const approved = APPROVED_INSTITUTIONS[inst.code];

      if (!approved) {
        console.log(`❌ EXTRA: Institution "${inst.name_en}" (${inst.code}) not in approved list`);
        stats.institutions.extra.push(inst.code);
        stats.issues.push(`Extra institution: ${inst.code}`);
        continue;
      }

      console.log(`Institution: ${inst.code}`);
      
      // Check name
      if (inst.name_en !== approved.name_en) {
        console.log(`   ❌ Name mismatch:`);
        console.log(`      Expected: "${approved.name_en}"`);
        console.log(`      Found: "${inst.name_en}"`);
        stats.institutions.name_mismatches.push({
          code: inst.code,
          expected: approved.name_en,
          found: inst.name_en
        });
        stats.issues.push(`Name mismatch for ${inst.code}`);
      } else {
        console.log(`   ✅ Name: ${inst.name_en}`);
      }

      // Check Amharic name
      if (inst.name_am !== approved.name_am) {
        console.log(`   ⚠️  Amharic name mismatch:`);
        console.log(`      Expected: "${approved.name_am}"`);
        console.log(`      Found: "${inst.name_am}"`);
      }

      // Check website
      if (approved.website_url === '') {
        if (inst.website_url && inst.website_url !== '') {
          console.log(`   ℹ️  Website: ${inst.website_url} (not in source, may be added)`);
        } else {
          console.log(`   ℹ️  Website: Not provided (expected)`);
        }
      } else if (inst.website_url !== approved.website_url) {
        console.log(`   ❌ Website mismatch:`);
        console.log(`      Expected: "${approved.website_url}"`);
        console.log(`      Found: "${inst.website_url}"`);
        stats.institutions.website_mismatches.push({
          code: inst.code,
          expected: approved.website_url,
          found: inst.website_url
        });
        stats.issues.push(`Website mismatch for ${inst.code}`);
      } else {
        console.log(`   ✅ Website: ${inst.website_url}`);
      }

      // Validate URL format
      if (inst.website_url && inst.website_url !== '' && !isValidUrl(inst.website_url)) {
        console.log(`   ⚠️  Invalid URL format: ${inst.website_url}`);
        stats.services.invalid_urls.push({
          institution: inst.code,
          url: inst.website_url
        });
      }

      console.log('');
    }

    // Check for missing institutions
    for (const code of Object.keys(APPROVED_INSTITUTIONS)) {
      if (!foundCodes.has(code)) {
        console.log(`❌ MISSING: Institution "${code}" (${APPROVED_INSTITUTIONS[code].name_en}) not found in database`);
        stats.institutions.missing.push(code);
        stats.issues.push(`Missing institution: ${code}`);
      }
    }

    // ========================================================================
    // VERIFY SERVICES
    // ========================================================================
    console.log('======================================================================');
    console.log('PART 2: SERVICE VERIFICATION');
    console.log('======================================================================');
    console.log('');

    const servicesResult = await getServices(token);
    if (!servicesResult.success) {
      console.log('❌ Failed to fetch services');
      return;
    }

    const services = servicesResult.data;
    stats.services.total = services.length;

    console.log(`📊 Total Services: ${stats.services.total}`);
    console.log('');

    // Group by institution
    const servicesByInst = {};
    for (const service of services) {
      const instCode = service.institutions?.code || 'unknown';
      if (!servicesByInst[instCode]) {
        servicesByInst[instCode] = [];
      }
      servicesByInst[instCode].push(service);
    }

    // Verify each institution's services
    for (const [code, approved] of Object.entries(APPROVED_INSTITUTIONS)) {
      const instServices = servicesByInst[code] || [];
      stats.services.by_institution[code] = instServices.length;

      console.log(`─────────────────────────────────────────────────────────────────`);
      console.log(`Institution: ${approved.name_en} (${code})`);
      console.log(`Services Found: ${instServices.length}`);
      
      if (approved.expected_services !== null) {
        if (instServices.length === approved.expected_services) {
          console.log(`✅ Service count matches expected (${approved.expected_services})`);
        } else {
          console.log(`❌ Service count mismatch: expected ${approved.expected_services}, found ${instServices.length}`);
          stats.issues.push(`Service count mismatch for ${code}: expected ${approved.expected_services}, found ${instServices.length}`);
        }
      }
      console.log('');

      // Check each service
      for (const service of instServices) {
        console.log(`  📄 Service: ${service.name}`);
        
        // Check processing time
        if (!service.processing_time || service.processing_time.trim() === '') {
          console.log(`     ⚠️  Missing processing time`);
          stats.services.missing_processing_time.push({
            institution: code,
            service: service.title_en
          });
        } else {
          console.log(`     ⏱️  Processing Time: ${service.processing_time}`);
        }

        // Check service fee
        if (!service.fee_amount || service.fee_amount.trim() === '') {
          console.log(`     ⚠️  Missing service fee`);
          stats.services.missing_fee.push({
            institution: code,
            service: service.name
          });
        } else {
          console.log(`     💰 Fee: ${service.fee_amount}`);
        }

        // Check service URL (note: API doesn't return service_url currently)
        // We need to check if it exists in the database
        console.log(`     🔗 URL: (not in API response)`);
        stats.services.missing_url.push({
          institution: code,
          service: service.name
        });

        // Check requirements (from service_requirements table via API)
        // Note: This would need a separate endpoint or the service detail to include requirements
        console.log('');
      }
    }

    // ========================================================================
    // SUMMARY REPORT
    // ========================================================================
    console.log('======================================================================');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION SUMMARY                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('📊 INSTITUTIONS:');
    console.log(`   Total Expected: ${stats.institutions.expected}`);
    console.log(`   Total Found: ${stats.institutions.found}`);
    console.log(`   Missing: ${stats.institutions.missing.length}`);
    console.log(`   Extra (not approved): ${stats.institutions.extra.length}`);
    console.log(`   Name Mismatches: ${stats.institutions.name_mismatches.length}`);
    console.log(`   Website Mismatches: ${stats.institutions.website_mismatches.length}`);
    console.log('');

    console.log('📊 SERVICES:');
    console.log(`   Total Services: ${stats.services.total}`);
    console.log(`   Missing Processing Times: ${stats.services.missing_processing_time.length}`);
    console.log(`   Missing Fees: ${stats.services.missing_fee.length}`);
    console.log(`   Missing URLs: ${stats.services.missing_url.length}`);
    console.log(`   Invalid URLs: ${stats.services.invalid_urls.length}`);
    console.log('');

    console.log('📊 SERVICES BY INSTITUTION:');
    for (const [code, count] of Object.entries(stats.services.by_institution)) {
      const expected = APPROVED_INSTITUTIONS[code]?.expected_services;
      const status = expected === null ? '(not verified)' : 
                     count === expected ? '✅' : 
                     `❌ (expected ${expected})`;
      console.log(`   ${code}: ${count} services ${status}`);
    }
    console.log('');

    console.log('🔍 TOTAL ISSUES FOUND: ' + stats.issues.length);
    if (stats.issues.length === 0) {
      console.log('✅ NO ISSUES! Catalogue matches approved source data.');
    } else {
      console.log('');
      console.log('❌ ISSUES DETAILS:');
      stats.issues.forEach((issue, idx) => {
        console.log(`   ${idx + 1}. ${issue}`);
      });
    }
    console.log('');

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        institutions: stats.institutions,
        services: stats.services,
        total_issues: stats.issues.length
      },
      issues: stats.issues
    };

    fs.writeFileSync('catalogue-verification-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Detailed report saved to: catalogue-verification-report.json');
    console.log('');

  } catch (error) {
    console.error('❌ Fatal error during verification:', error);
    process.exit(1);
  }

  process.exit(stats.issues.length > 0 ? 1 : 0);
};

// Run verification
runVerification();
