import { supabase } from '../config/supabase.js';

/**
 * Get dashboard data based on user role
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Dashboard data
 */
export const getDashboardData = async (currentUser) => {
  try {
    let dashboardData = {};

    switch (currentUser.role) {
      case 'SUPER_ADMIN':
      case 'MESOB_MANAGER':
        dashboardData = await getSuperAdminDashboard();
        break;
      case 'INSTITUTION_MANAGER':
        dashboardData = await getInstitutionManagerDashboard(currentUser.institution_id);
        break;
      case 'EMPLOYEE':
        dashboardData = await getEmployeeDashboard(currentUser.id, currentUser.institution_id);
        break;
      case 'TECHNICIAN':
      case 'ICT_STAFF':
        dashboardData = await getIctStaffDashboard(currentUser.id, currentUser.institution_id);
        break;
      case 'CUSTOMER':
      case 'CITIZEN':
        dashboardData = await getCustomerDashboard(currentUser.id);
        break;
      default:
        return {
          success: false,
          message: 'Invalid user role.'
        };
    }

    return {
      success: true,
      data: dashboardData
    };

  } catch (error) {
    console.error('Get dashboard data error:', error);
    return {
      success: false,
      message: 'Failed to fetch dashboard data.'
    };
  }
};

/**
 * Super Admin / MESOB Manager Dashboard
 */
const getSuperAdminDashboard = async () => {
  // Total institutions
  const { count: totalInstitutions } = await supabase
    .from('institutions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  // Total services
  const { count: totalServices } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  // Total users by role
  const { data: usersByRole } = await supabase
    .from('users')
    .select('role')
    .eq('status', 'ACTIVE');

  const roleCount = usersByRole.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  // Total applications (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo);

  // Applications by status
  const { data: appsByStatus } = await supabase
    .from('applications')
    .select('status');

  const statusCount = appsByStatus.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  // Queue stats (today)
  const today = new Date().toISOString().split('T')[0];
  const { count: todayQueue } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .gte('queue_date', today);

  // Maintenance reports
  const { count: openReports } = await supabase
    .from('maintenance_reports')
    .select('id', { count: 'exact', head: true })
    .in('status', ['REPORTED', 'ASSIGNED', 'IN_PROGRESS']);

  return {
    totalInstitutions,
    totalServices,
    totalUsers: usersByRole.length,
    usersByRole: roleCount,
    recentApplications,
    applicationsByStatus: statusCount,
    todayQueue,
    openMaintenanceReports: openReports
  };
};

/**
 * Institution Manager Dashboard
 */
const getInstitutionManagerDashboard = async (institutionId) => {
  // Institution services
  const { count: totalServices } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('status', 'ACTIVE');

  // Institution staff
  const { count: totalStaff } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .in('role', ['EMPLOYEE', 'ICT_STAFF'])
    .eq('status', 'ACTIVE');

  // Applications (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .gte('created_at', thirtyDaysAgo);

  // Pending applications
  const { count: pendingApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .in('status', ['SUBMITTED', 'UNDER_REVIEW']);

  // Today's queue
  const today = new Date().toISOString().split('T')[0];
  let todayQueueQuery = supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .gte('queue_date', today);
  if (institutionId) {
    todayQueueQuery = todayQueueQuery.eq('institution_id', institutionId);
  }
  const { count: todayQueue } = await todayQueueQuery;

  const { count: pendingQueue } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('status', 'PENDING')
    .gte('queue_date', today);

  // Maintenance reports
  const { count: openReports } = await supabase
    .from('maintenance_reports')
    .select('id', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .in('status', ['REPORTED', 'ASSIGNED', 'IN_PROGRESS']);

  return {
    totalServices,
    totalStaff,
    recentApplications,
    pendingApplications,
    todayQueue,
    pendingQueue,
    openMaintenanceReports: openReports
  };
};

/**
 * Employee Dashboard
 */
const getEmployeeDashboard = async (userId, institutionId) => {
  // Assigned applications
  const { count: myApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_employee_id', userId)
    .in('status', ['UNDER_REVIEW', 'PENDING_DOCUMENTS']);

  // Today's queue
  const today = new Date().toISOString().split('T')[0];
  let todayQueueQuery = supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .gte('queue_date', today);
  if (institutionId) {
    todayQueueQuery = todayQueueQuery.eq('institution_id', institutionId);
  }
  const { count: todayQueue } = await todayQueueQuery;

  const { count: myQueue } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', userId)
    .gte('queue_date', today)
    .eq('status', 'IN_PROGRESS');

  // Completed today
  const { count: completedToday } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .eq('employee_id', userId)
    .gte('completed_at', today)
    .eq('status', 'COMPLETED');

  return {
    myApplications,
    todayQueue,
    myQueue,
    completedToday
  };
};

/**
 * ICT Staff / Technician Dashboard
 */
const getIctStaffDashboard = async (userId, institutionId) => {
  // My tasks
  const { count: myTasks } = await supabase
    .from('maintenance_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_ict_id', userId)
    .in('status', ['PENDING', 'IN_PROGRESS']);

  // Pending reports (unassigned)
  let pendingReportsQuery = supabase
    .from('maintenance_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'REPORTED');
  if (institutionId) {
    pendingReportsQuery = pendingReportsQuery.eq('institution_id', institutionId);
  }
  const { count: pendingReports } = await pendingReportsQuery;

  // Completed this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: completedThisWeek } = await supabase
    .from('maintenance_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('assigned_ict_id', userId)
    .eq('status', 'COMPLETED')
    .gte('completed_at', weekAgo);

  // Critical reports
  let criticalReportsQuery = supabase
    .from('maintenance_reports')
    .select('id', { count: 'exact', head: true })
    .eq('priority', 'CRITICAL')
    .in('status', ['REPORTED', 'ASSIGNED', 'IN_PROGRESS']);
  if (institutionId) {
    criticalReportsQuery = criticalReportsQuery.eq('institution_id', institutionId);
  }
  const { count: criticalReports } = await criticalReportsQuery;

  return {
    myTasks: myTasks || 0,
    pendingReports: pendingReports || 0,
    completedThisWeek: completedThisWeek || 0,
    criticalReports: criticalReports || 0
  };
};

/**
 * Customer Dashboard
 */
const getCustomerDashboard = async (userId) => {
  // My applications
  const { count: myApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('citizen_id', userId);

  const { count: pendingApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('citizen_id', userId)
    .in('status', ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS']);

  const { count: approvedApplications } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('citizen_id', userId)
    .in('status', ['APPROVED', 'COMPLETED']);

  // My queue entries (today)
  const today = new Date().toISOString().split('T')[0];
  const { count: todayQueue } = await supabase
    .from('queues')
    .select('id', { count: 'exact', head: true })
    .eq('citizen_id', userId)
    .gte('queue_date', today);

  // Available services count
  const { count: availableServices } = await supabase
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  // Active institutions count
  const { count: activeInstitutions } = await supabase
    .from('institutions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ACTIVE');

  return {
    myApplications,
    pendingApplications,
    approvedApplications,
    todayQueue,
    availableServices,
    activeInstitutions
  };
};
