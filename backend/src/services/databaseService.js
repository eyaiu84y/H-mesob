import { supabase } from '../config/supabase.js';

/**
 * Database verification and health check service
 * Verifies connection and schema integrity
 */

/**
 * Get list of all tables in the public schema
 */
export async function getDatabaseTables() {
  try {
    const { data, error } = await supabase
      .rpc('get_table_names');

    // Fallback: Try to query each expected table
    if (!data || error) {
      const expectedTables = [
        'users',
        'institutions',
        'services',
        'service_requirements',
        'applications',
        'queues',
        'maintenance_reports',
        'maintenance_attachments',
        'maintenance_tasks',
        'announcements',
        'notifications',
        'audit_logs',
        'failed_login_attempts',
        'user_sessions'
      ];

      const tableChecks = await Promise.all(
        expectedTables.map(async (table) => {
          try {
            const { error: tableError } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true })
              .limit(0);
            return tableError ? null : table;
          } catch {
            return null;
          }
        })
      );

      return tableChecks.filter(Boolean);
    }

    return data;
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return [];
  }
}

/**
 * Count total institutions
 */
export async function getInstitutionCount() {
  try {
    const { count, error } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  } catch (error) {
    console.error('Error counting institutions:', error.message);
    return null;
  }
}

/**
 * Get list of all institutions
 */
export async function getInstitutions() {
  try {
    const { data, error } = await supabase
      .from('institutions')
      .select('code, name_en, status')
      .order('name_en');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching institutions:', error.message);
    return [];
  }
}

/**
 * Verify database schema integrity
 */
export async function verifyDatabaseSchema() {
  const expectedTables = [
    'users',
    'institutions',
    'services',
    'service_requirements',
    'applications',
    'queues',
    'maintenance_reports',
    'maintenance_attachments',
    'maintenance_tasks',
    'announcements',
    'notifications',
    'audit_logs',
    'failed_login_attempts',
    'user_sessions'
  ];

  const expectedInstitutionCount = 12;

  try {
    // Get actual tables
    const actualTables = await getDatabaseTables();

    // Get institution count
    const institutionCount = await getInstitutionCount();

    // Check if all expected tables exist
    const missingTables = expectedTables.filter(
      (table) => !actualTables.includes(table)
    );

    // Check for unexpected tables
    const unexpectedTables = actualTables.filter(
      (table) => !expectedTables.includes(table)
    );

    // Verify institution count
    const institutionCountCorrect =
      institutionCount === expectedInstitutionCount;

    const verification = {
      passed: missingTables.length === 0 && institutionCountCorrect,
      tables: {
        expected: expectedTables.length,
        actual: actualTables.length,
        missing: missingTables,
        unexpected: unexpectedTables,
        allPresent: missingTables.length === 0
      },
      institutions: {
        expected: expectedInstitutionCount,
        actual: institutionCount,
        correct: institutionCountCorrect
      }
    };

    return verification;
  } catch (error) {
    console.error('Error verifying database schema:', error.message);
    return {
      passed: false,
      error: error.message,
      tables: { expected: 12, actual: 0, missing: expectedTables },
      institutions: { expected: 12, actual: null, correct: false }
    };
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('institutions')
      .select('count', { count: 'exact', head: true })
      .limit(0);

    if (error && error.code === '42P01') {
      // Table doesn't exist - connection works but schema not created
      return {
        connected: true,
        schemaExists: false,
        message: 'Connected to Supabase, but database schema not found. Please run migrations.'
      };
    }

    if (error) {
      throw error;
    }

    return {
      connected: true,
      schemaExists: true,
      message: 'Successfully connected to Supabase database'
    };
  } catch (error) {
    return {
      connected: false,
      schemaExists: false,
      message: error.message || 'Failed to connect to database'
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const [tables, institutionCount, institutions] = await Promise.all([
      getDatabaseTables(),
      getInstitutionCount(),
      getInstitutions()
    ]);

    return {
      tableCount: tables.length,
      tables,
      institutionCount,
      institutions
    };
  } catch (error) {
    console.error('Error getting database stats:', error.message);
    return {
      tableCount: 0,
      tables: [],
      institutionCount: null,
      institutions: []
    };
  }
}

export default {
  getDatabaseTables,
  getInstitutionCount,
  getInstitutions,
  verifyDatabaseSchema,
  testDatabaseConnection,
  getDatabaseStats
};
