import { supabase } from '../config/supabase.js';
import { sendQueueCallSMS, sendQueueJoinSMS, logSMSNotification } from './smsService.js';
import { createNotification } from './notificationService.js';

/**
 * Join queue
 * @param {Object} queueData - Queue data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Queue entry
 */
export const joinQueue = async (queueData, currentUser) => {
  try {
    const { institutionId, serviceId, priority } = queueData;

    console.log('=== JOIN QUEUE SERVICE ===');
    console.log('Current User:', currentUser);
    console.log('Queue Data:', queueData);

    // Validate authenticated user
    if (!currentUser || !currentUser.id) {
      console.error('❌ No authenticated user');
      return {
        success: false,
        message: 'Authenticated citizen information is required.'
      };
    }

    // Validate queue data
    if (!institutionId || !serviceId) {
      console.error('❌ Missing institutionId or serviceId');
      return {
        success: false,
        message: 'Institution ID and Service ID are required.'
      };
    }

    console.log('✅ Validation passed');

    // Check if user is already in queue for this service today
    const today = new Date().toISOString().split('T')[0];

    console.log('Checking existing queue for today:', today);

    const {
      data: existingQueue,
      error: existingQueueError
    } = await supabase
      .from('queue_entries')
      .select('id, queue_number, status')
      .eq('citizen_id', currentUser.id)
      .eq('institution_id', institutionId)
      .eq('service_id', serviceId)
      .gte('created_at', today)
      .in('status', ['PENDING', 'WAITING', 'IN_PROGRESS'])
      .limit(1)
      .maybeSingle();

    if (existingQueueError) {
      console.error('=== EXISTING QUEUE CHECK ERROR ===');
      console.error('Error Code:', existingQueueError.code);
      console.error('Error Message:', existingQueueError.message);
      console.error('Error Details:', existingQueueError.details);
      console.error('Error Hint:', existingQueueError.hint);
      console.error('Full Error:', JSON.stringify(existingQueueError, null, 2));
      console.error('===================================');

      return {
        success: false,
        message: existingQueueError.message || 'Failed to check existing queue.'
      };
    }

    if (existingQueue) {
      return {
        success: false,
        message: `You are already in queue with token number ${existingQueue.queue_number}`
      };
    }

    // Get the highest queue number for the year to generate next number
    const currentYear = new Date().getFullYear();
    const queuePrefix = `Q-${currentYear}-`;
    
    console.log('Finding highest queue number for prefix:', queuePrefix);

    const {
      data: latestQueues,
      error: latestError
    } = await supabase
      .from('queue_entries')
      .select('queue_number')
      .like('queue_number', `${queuePrefix}%`)
      .order('queue_number', { ascending: false })
      .limit(1);

    if (latestError) {
      console.error('=== LATEST QUEUE ERROR ===');
      console.error('Error:', latestError);
      console.error('==========================');

      return {
        success: false,
        message: 'Failed to generate queue token.'
      };
    }

    let tokenNum = 1;
    if (latestQueues && latestQueues.length > 0) {
      // Extract number from last queue number (e.g., "Q-2026-0005" -> 5)
      const lastNumber = latestQueues[0].queue_number.split('-')[2];
      tokenNum = parseInt(lastNumber, 10) + 1;
    }

    const queueNumber = `${queuePrefix}${String(tokenNum).padStart(4, '0')}`;

    console.log('Generated queue number:', queueNumber);

    // Create queue entry
    const {
      data: newQueue,
      error
    } = await supabase
      .from('queue_entries')
      .insert({
        queue_number: queueNumber,
        institution_id: institutionId,
        service_id: serviceId,
        citizen_id: currentUser.id,
        priority: priority || 'NORMAL',
        status: 'PENDING',
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        queue_number,
        created_at,
        priority,
        status,
        services (
          id,
          title_en,
          title_am
        ),
        institutions (
          id,
          name_en,
          name_am
        )
      `)
      .single();

    if (error) {
      console.error('=== JOIN QUEUE INSERT ERROR ===');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      console.error('Full Error:', JSON.stringify(error, null, 2));
      console.error('Attempted Insert:', {
        queue_number: queueNumber,
        institution_id: institutionId,
        service_id: serviceId,
        citizen_id: currentUser.id,
        priority: priority || 'NORMAL',
        status: 'PENDING'
      });
      console.error('==============================');

      return {
        success: false,
        message: error.message || 'Failed to join queue.',
        error: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    // Notify customer
    await createNotification({
      recipientId: currentUser.id,
      type: 'QUEUE_ASSIGNMENT',
      title: 'Queue Ticket Issued',
      message: `You have joined the queue with Token #${queueNumber}.`,
      relatedEntityId: newQueue.id,
      relatedEntityType: 'queue'
    });

    // Notify institution employees & manager
    await createNotification({
      institutionId,
      roles: ['EMPLOYEE', 'INSTITUTION_MANAGER'],
      type: 'QUEUE_ASSIGNMENT',
      title: 'New Queue Entry',
      message: `Token #${queueNumber} has joined the queue.`,
      relatedEntityId: newQueue.id,
      relatedEntityType: 'queue'
    });

    // Log audit
    await logAudit(
      currentUser.id,
      'QUEUE_JOIN',
      `Joined queue with token ${queueNumber}`
    );

    // Send SMS confirmation (don't let this block success)
    try {
      if (currentUser.phone) {
        // Count pending tokens before this one to get position
        const { count } = await supabase
          .from('queue_entries')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('status', 'PENDING')
          .lt('created_at', new Date().toISOString());

        const position = (count || 0) + 1;

        // Send SMS
        const smsResult = await sendQueueJoinSMS(
          currentUser.phone,
          queueNumber,
          newQueue.institutions?.name_en || 'MESOB Center',
          position,
          'en' // or 'am' for Amharic
        );

        // Log SMS attempt
        await logSMSNotification(
          currentUser.id,
          currentUser.phone,
          `Queue join: ${queueNumber}`,
          smsResult.success ? 'SUCCESS' : 'FAILED',
          smsResult.data
        );

        if (smsResult.success) {
          console.log('✅ Queue join SMS sent to citizen:', currentUser.phone);
        } else {
          console.log('⚠️ Queue join SMS failed (non-critical):', smsResult.message);
        }
      } else {
        console.log('⚠️ No phone number for citizen (SMS skipped)');
      }
    } catch (smsError) {
      console.error('⚠️ Failed to send queue join SMS (non-critical):', smsError);
    }

    return {
      success: true,
      message: 'Successfully joined queue',
      data: newQueue
    };

  } catch (error) {
    console.error('=== JOIN QUEUE UNEXPECTED ERROR ===');
    console.error('Error:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('===================================');

    return {
      success: false,
      message: error.message || 'An error occurred while joining queue.'
    };
  }
};
/**
 * Calculates live queue position, estimated waiting time, and current serving token
 * based on actual database records for the relevant service and institution.
 * 
 * Rules:
 * - Counter is serving any ticket with status 'IN_PROGRESS'.
 * - People ahead of a WAITING/PENDING ticket:
 *   1. Any ticket currently 'IN_PROGRESS' for the same institution and service.
 *   2. Any ticket with status 'WAITING' or 'PENDING' for the same institution and service that is:
 *      - Higher priority (URGENT > NORMAL), OR
 *      - Same priority and created earlier (created_at < ticket.created_at, or if equal, queue_number < ticket.queue_number).
 *   3. Excludes: COMPLETED, CANCELLED, and the ticket itself.
 * - Estimated waiting time = peopleAhead * averageDurationMinutes (default 6 mins).
 * 
 * @param {Object} queueEntry - The queue record
 * @returns {Promise<Object>} { people_ahead, estimated_wait_minutes, current_serving }
 */
export const calculateQueuePositionAndEstimate = async (queueEntry) => {
  try {
    if (!queueEntry) {
      return {
        people_ahead: 0,
        estimated_wait_minutes: 0,
        current_serving: 'None'
      };
    }

    const status = queueEntry.status;

    // Completed or cancelled entries have 0 people ahead and 0 wait time
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      return {
        people_ahead: 0,
        estimated_wait_minutes: 0,
        current_serving: 'None',
        queue_readiness: status
      };
    }

    const institutionId = queueEntry.institution_id;
    const serviceId = queueEntry.service_id;

    // Query all active entries for this institution and service
    let query = supabase
      .from('queue_entries')
      .select('id, queue_number, priority, status, created_at, institution_id, service_id, citizen_id')
      .in('status', ['IN_PROGRESS', 'PENDING', 'WAITING']);

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data: activeEntries, error } = await query;

    if (error) {
      console.error('Error fetching active queue entries for position calculation:', error);
      return {
        people_ahead: 0,
        estimated_wait_minutes: 0,
        current_serving: 'N/A'
      };
    }

    const entries = activeEntries || [];

    // Find who is currently being served
    const inProgressEntries = entries.filter(e => e.status === 'IN_PROGRESS');
    const currentServing = inProgressEntries.length > 0
      ? inProgressEntries[0].queue_number
      : 'None';

    // If this ticket is currently IN_PROGRESS, customer is currently at counter
    if (status === 'IN_PROGRESS') {
      return {
        people_ahead: 0,
        estimated_wait_minutes: 0,
        current_serving: queueEntry.queue_number,
        queue_readiness: 'CALLED'
      };
    }

    // Customer is WAITING or PENDING
    const myPriority = queueEntry.priority === 'URGENT' ? 'URGENT' : 'NORMAL';
    const myCreatedAt = new Date(queueEntry.created_at || Date.now()).getTime();

    // 1. In-progress tickets count as ahead (being served at counter)
    let peopleAhead = inProgressEntries.filter(e => e.id !== queueEntry.id).length;

    // 2. Pending/Waiting tickets ahead of this ticket based on priority and creation order
    for (const entry of entries) {
      if (entry.id === queueEntry.id) continue;
      if (entry.status !== 'PENDING' && entry.status !== 'WAITING') continue;

      const entryPriority = entry.priority === 'URGENT' ? 'URGENT' : 'NORMAL';
      const entryCreatedAt = new Date(entry.created_at).getTime();

      if (myPriority === 'NORMAL') {
        if (entryPriority === 'URGENT') {
          // URGENT always ahead of NORMAL
          peopleAhead++;
        } else {
          // Both NORMAL: earlier created_at or lower queue_number is ahead
          if (entryCreatedAt < myCreatedAt) {
            peopleAhead++;
          } else if (entryCreatedAt === myCreatedAt && entry.queue_number < queueEntry.queue_number) {
            peopleAhead++;
          }
        }
      } else {
        // myPriority === 'URGENT'
        if (entryPriority === 'URGENT') {
          if (entryCreatedAt < myCreatedAt) {
            peopleAhead++;
          } else if (entryCreatedAt === myCreatedAt && entry.queue_number < queueEntry.queue_number) {
            peopleAhead++;
          }
        }
        // NORMAL entries are behind URGENT
      }
    }

    // Average duration in minutes (configurable default: 6 minutes)
    const DEFAULT_SERVICE_DURATION_MINUTES = 6;
    const estimatedWaitMinutes = peopleAhead * DEFAULT_SERVICE_DURATION_MINUTES;

    // Trigger turn-approaching notification if peopleAhead <= 2 and > 0
    if (peopleAhead <= 2 && peopleAhead > 0 && queueEntry.citizen_id) {
      try {
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_id', queueEntry.citizen_id)
          .eq('related_entity_id', queueEntry.id)
          .eq('type', 'QUEUE_ASSIGNMENT')
          .ilike('title', '%Turn Approaching%')
          .limit(1)
          .maybeSingle();

        if (!existingNotif) {
          await createNotification({
            recipientId: queueEntry.citizen_id,
            type: 'QUEUE_ASSIGNMENT',
            title: 'Turn Approaching',
            message: `Your turn is approaching! Token #${queueEntry.queue_number} has only ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead.`,
            relatedEntityId: queueEntry.id,
            relatedEntityType: 'queue'
          });
          console.log(`🔔 Turn approaching notification sent to citizen ${queueEntry.citizen_id} for token ${queueEntry.queue_number}`);
        }
      } catch (notifErr) {
        console.error('Failed to send turn approaching notification (non-blocking):', notifErr);
      }
    }

    // Check queue readiness and staff availability
    let queueReadiness = 'WAITING';
    if (peopleAhead === 0) {
      let employeeAvailable = true;
      if (institutionId) {
        const { count: staffCount, error: staffErr } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .in('role', ['EMPLOYEE', 'INSTITUTION_MANAGER'])
          .eq('status', 'ACTIVE');

        if (!staffErr && staffCount !== null) {
          employeeAvailable = staffCount > 0;
        }
      }
      queueReadiness = employeeAvailable ? 'READY_TO_CALL' : 'AWAITING_STAFF';
    }

    return {
      people_ahead: peopleAhead,
      estimated_wait_minutes: estimatedWaitMinutes,
      current_serving: currentServing,
      queue_readiness: queueReadiness
    };
  } catch (err) {
    console.error('calculateQueuePositionAndEstimate error:', err);
    return {
      people_ahead: 0,
      estimated_wait_minutes: 0,
      current_serving: 'N/A',
      queue_readiness: 'WAITING'
    };
  }
};

export const getQueues = async (filters = {}, currentUser) => {
  try {
    if (!currentUser || !currentUser.id || !currentUser.role) {
      return {
        success: false,
        message: 'Authenticated user information is required.'
      };
    }

    let query = supabase
      .from('queue_entries')
      .select(`
        id,
        queue_number,
        institution_id,
        service_id,
        citizen_id,
        assigned_to,
        priority,
        status,
        created_at,
        started_at,
        completed_at,
        updated_at,
        institutions (
          id,
          code,
          name_en,
          name_am
        ),
        services (
          id,
          title_en,
          title_am,
          processing_time,
          service_fee
        )
      `)
      .order('created_at', { ascending: false });

    /*
     * ---------------------------------------------------------
     * ROLE-BASED ACCESS CONTROL
     * ---------------------------------------------------------
     */

    const userRole = (currentUser.role || '').toUpperCase();
    if (userRole === 'CITIZEN' || userRole === 'CUSTOMER') {
      query = query.eq('citizen_id', currentUser.id);
    }

    else if (
      ['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(
        userRole
      )
    ) {
      if (!currentUser.institution_id) {
        return {
          success: false,
          message: 'User is not assigned to an institution.'
        };
      }

      query = query.eq(
        'institution_id',
        currentUser.institution_id
      );
    }

    /*
     * SUPER_ADMIN and MESOB_MANAGER can see all queues.
     * They may optionally filter by institution.
     */

    if (
      filters.institutionId &&
      ['SUPER_ADMIN', 'MESOB_MANAGER'].includes(currentUser.role)
    ) {
      query = query.eq(
        'institution_id',
        filters.institutionId
      );
    }

    /*
     * Optional status filter
     */

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    /*
     * Optional date filter
     */

    if (filters.date) {
      query = query.gte(
        'created_at',
        `${filters.date}T00:00:00.000Z`
      );
    }

    /*
     * ---------------------------------------------------------
     * STEP 1: FETCH QUEUE ENTRIES
     * ---------------------------------------------------------
     */

    const {
      data: queueEntries,
      error: queueError
    } = await query;

    if (queueError) {
      console.error('GET /api/queues - queue_entries error:', {
        code: queueError.code,
        message: queueError.message,
        details: queueError.details,
        hint: queueError.hint
      });

      return {
        success: false,
        message: 'Failed to fetch queues.',
        ...(process.env.NODE_ENV !== 'production' && {
          error: queueError.message
        })
      };
    }

    if (!queueEntries || queueEntries.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    /*
     * ---------------------------------------------------------
     * STEP 2: COLLECT RELATED IDS
     * ---------------------------------------------------------
     */

    const serviceIds = [
      ...new Set(
        queueEntries
          .map(queue => queue.service_id)
          .filter(Boolean)
      )
    ];

    const institutionIds = [
      ...new Set(
        queueEntries
          .map(queue => queue.institution_id)
          .filter(Boolean)
      )
    ];

    const citizenIds = [
      ...new Set(
        queueEntries
          .map(queue => queue.citizen_id)
          .filter(Boolean)
      )
    ];

    const employeeIds = [
      ...new Set(
        queueEntries
          .map(queue => queue.assigned_to)
          .filter(Boolean)
      )
    ];

    /*
     * ---------------------------------------------------------
     * STEP 3: FETCH SERVICES
     * ---------------------------------------------------------
     */

    let services = [];

    if (serviceIds.length > 0) {
      const {
        data,
        error
      } = await supabase
        .from('services')
        .select(`
          id,
          title_en,
          title_am
        `)
        .in('id', serviceIds);

      if (error) {
        console.error(
          'GET /api/queues - services error:',
          error
        );

        return {
          success: false,
          message: 'Failed to fetch queue services.'
        };
      }

      services = data || [];
    }

    /*
     * ---------------------------------------------------------
     * STEP 4: FETCH INSTITUTIONS
     * ---------------------------------------------------------
     */

    let institutions = [];

    if (institutionIds.length > 0) {
      const {
        data,
        error
      } = await supabase
        .from('institutions')
        .select(`
          id,
          name_en,
          name_am
        `)
        .in('id', institutionIds);

      if (error) {
        console.error(
          'GET /api/queues - institutions error:',
          error
        );

        return {
          success: false,
          message: 'Failed to fetch queue institutions.'
        };
      }

      institutions = data || [];
    }

    /*
     * ---------------------------------------------------------
     * STEP 5: FETCH CITIZENS
     * ---------------------------------------------------------
     */

    let citizens = [];

    if (citizenIds.length > 0) {
      const {
        data,
        error
      } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          phone,
          email
        `)
        .in('id', citizenIds);

      if (error) {
        console.error(
          'GET /api/queues - citizens error:',
          error
        );

        return {
          success: false,
          message: 'Failed to fetch queue citizens.'
        };
      }

      citizens = data || [];
    }

    /*
     * ---------------------------------------------------------
     * STEP 6: FETCH ASSIGNED EMPLOYEES
     * ---------------------------------------------------------
     */

    let employees = [];

    if (employeeIds.length > 0) {
      const {
        data,
        error
      } = await supabase
        .from('users')
        .select(`
          id,
          full_name
        `)
        .in('id', employeeIds);

      if (error) {
        console.error(
          'GET /api/queues - employees error:',
          error
        );

        return {
          success: false,
          message: 'Failed to fetch assigned employees.'
        };
      }

      employees = data || [];
    }

    /*
     * ---------------------------------------------------------
     * STEP 7: CREATE LOOKUP MAPS
     * ---------------------------------------------------------
     */

    const serviceMap = new Map(
      services.map(service => [
        service.id,
        service
      ])
    );

    const institutionMap = new Map(
      institutions.map(institution => [
        institution.id,
        institution
      ])
    );

    const citizenMap = new Map(
      citizens.map(citizen => [
        citizen.id,
        citizen
      ])
    );

    const employeeMap = new Map(
      employees.map(employee => [
        employee.id,
        employee
      ])
    );

    /*
     * ---------------------------------------------------------
     * STEP 8: BUILD FINAL RESPONSE
     * ---------------------------------------------------------
     */

    const result = queueEntries.map(queue => ({
      ...queue,
      customer_id: queue.citizen_id,
      customer: citizenMap.get(queue.citizen_id) || null,

      services:
        serviceMap.get(queue.service_id) || null,

      institutions:
        institutionMap.get(queue.institution_id) || null,

      users:
        citizenMap.get(queue.citizen_id) || null,

      employee:
        employeeMap.get(queue.assigned_to) || null
    }));

    // Enrich active tickets with live queue position, estimated wait time, and current serving token
    for (const queue of result) {
      if (['PENDING', 'WAITING', 'IN_PROGRESS'].includes(queue.status)) {
        const liveInfo = await calculateQueuePositionAndEstimate(queue);
        queue.people_ahead = liveInfo.people_ahead;
        queue.estimated_wait_minutes = liveInfo.estimated_wait_minutes;
        queue.current_serving = liveInfo.current_serving;
        queue.queue_readiness = liveInfo.queue_readiness;
      } else {
        queue.people_ahead = 0;
        queue.estimated_wait_minutes = 0;
        queue.current_serving = 'None';
        queue.queue_readiness = queue.status;
      }
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(
      'GET /api/queues unexpected error:',
      error
    );

    return {
      success: false,
      message: 'An error occurred while fetching queues.'
    };
  }
};

/**
 * Get queue by ID
 * @param {string} queueId - Queue ID
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Queue data
 */
export const getQueueById = async (queueId, currentUser) => {
  try {
    const { data: queue, error } = await supabase
      .from('queue_entries')
      .select(`
        *,
        services (
          id,
          title_en,
          title_am
        ),
        institutions (
          id,
          name_en,
          name_am
        ),
        users!queue_entries_citizen_id_fkey (
          id,
          full_name,
          phone,
          email
        ),
        employee:users!queue_entries_assigned_to_fkey (
          id,
          full_name
        )
      `)
      .eq('id', queueId)
      .single();

    if (error || !queue) {
      return {
        success: false,
        message: 'Queue entry not found.'
      };
    }

    // Authorization check
    const userRole = (currentUser.role || '').toUpperCase();
    if ((userRole === 'CITIZEN' || userRole === 'CUSTOMER') && queue.citizen_id !== currentUser.id) {
      return {
        success: false,
        message: 'You do not have permission to view this queue entry.'
      };
    }

    if (['EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF', 'INSTITUTION_MANAGER'].includes(userRole)
        && queue.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You do not have permission to view this queue entry.'
      };
    }

    if (['PENDING', 'WAITING', 'IN_PROGRESS'].includes(queue.status)) {
      const liveInfo = await calculateQueuePositionAndEstimate(queue);
      queue.people_ahead = liveInfo.people_ahead;
      queue.estimated_wait_minutes = liveInfo.estimated_wait_minutes;
      queue.current_serving = liveInfo.current_serving;
      queue.queue_readiness = liveInfo.queue_readiness;
    } else {
      queue.people_ahead = 0;
      queue.estimated_wait_minutes = 0;
      queue.current_serving = 'None';
      queue.queue_readiness = queue.status;
    }

    return {
      success: true,
      data: queue
    };

  } catch (error) {
    console.error('Get queue by ID error:', error);
    return {
      success: false,
      message: 'Failed to fetch queue entry.'
    };
  }
};

/**
 * Call next person in queue
 * @param {string} queueId - Queue ID (optional - if not provided, calls next pending)
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated queue entry
 */
export const callNext = async (queueId, currentUser) => {
  try {
    console.log('=== CALL NEXT SERVICE ===');
    console.log('Queue ID:', queueId);
    console.log('Current User:', currentUser);
    console.log('Institution ID:', currentUser?.institution_id);
    
    let queue;

    if (queueId) {
      // Call specific queue entry
      console.log('Fetching specific queue entry:', queueId);
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('id', queueId)
        .single();
      
      if (error) {
        console.error('Error fetching specific queue:', error);
        return {
          success: false,
          message: 'Failed to fetch queue entry.'
        };
      }
      
      queue = data;
    } else {
      // Get next pending or waiting queue entry for this institution
      const targetInstitutionId = currentUser?.institution_id;
      console.log('Auto-selecting next waiting/pending queue for institution:', targetInstitutionId);
      
      let query = supabase
        .from('queue_entries')
        .select('*')
        .in('status', ['PENDING', 'WAITING']);

      if (targetInstitutionId) {
        query = query.eq('institution_id', targetInstitutionId);
      }

      const { data, error } = await query
        .order('priority', { ascending: false }) // URGENT first
        .order('queue_number', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching next pending/waiting queue:', error);
        return {
          success: false,
          message: 'Failed to fetch next queue entry.'
        };
      }
      
      queue = data;
    }

    if (!queue) {
      console.log('❌ No queue found');
      return {
        success: false,
        message: 'No pending queue entries found.'
      };
    }

    console.log('✅ Found queue to call:', queue);

    // Update queue status (without join to avoid foreign key issues)
    console.log('Attempting to update queue_entries...');
    const { data: updatedQueue, error: updateError } = await supabase
      .from('queue_entries')
      .update({
        status: 'IN_PROGRESS',
        assigned_to: currentUser.id,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', queue.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Call next update error:', updateError);
      console.error('Error code:', updateError.code);
      console.error('Error message:', updateError.message);
      console.error('Error details:', JSON.stringify(updateError.details));
      console.error('Error hint:', updateError.hint);
      return {
        success: false,
        message: `Failed to update queue: ${updateError.message || 'Unknown error'}`
      };
    }

    if (!updatedQueue) {
      console.error('❌ No data returned from update');
      return {
        success: false,
        message: 'Failed to update queue entry.'
      };
    }

    console.log('✅ Queue updated to IN_PROGRESS:', updatedQueue);

    // Notify customer
    try {
      await createNotification({
        recipientId: queue.citizen_id,
        type: 'QUEUE_ASSIGNMENT',
        title: 'Your Turn in Queue',
        message: `Token #${queue.queue_number} - Please proceed to the service counter.`,
        relatedEntityId: queue.id,
        relatedEntityType: 'queue'
      });
      console.log('✅ Notification sent to customer');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification (non-critical):', notifError);
    }

    // Send SMS notification when citizen is called (don't let this block success)
    try {
      // Fetch citizen phone number and name
      const { data: citizen, error: citizenError } = await supabase
        .from('users')
        .select('phone, full_name')
        .eq('id', queue.citizen_id)
        .single();

      if (!citizenError && citizen && citizen.phone) {
        // Fetch institution name
        const { data: institution } = await supabase
          .from('institutions')
          .select('name_en, name_am')
          .eq('id', queue.institution_id)
          .single();

        const institutionName = institution?.name_en || 'MESOB Center';

        console.log('[SMS] Preparing to send queue call SMS to:', citizen.phone);

        // Send SMS notification (in English by default, can add language preference later)
        const smsResult = await sendQueueCallSMS(
          citizen.phone,
          queue.queue_number,
          institutionName,
          'en' // Change to 'am' for Amharic
        );

        // Log SMS attempt to database
        await logSMSNotification(
          queue.citizen_id,
          citizen.phone,
          `Queue ${queue.queue_number} called at ${institutionName}`,
          smsResult.success ? 'SUCCESS' : 'FAILED',
          smsResult.data
        );

        if (smsResult.success) {
          console.log('✅ SMS sent successfully to citizen:', citizen.phone);
        } else {
          console.log('⚠️ SMS failed (non-critical):', smsResult.message);
        }
      } else {
        console.log('⚠️ No phone number for citizen (SMS skipped)');
      }
    } catch (smsError) {
      console.error('⚠️ Failed to send SMS (non-critical):', smsError);
    }

    // Log audit (don't let this block success)
    try {
      await logAudit(currentUser.id, 'QUEUE_CALL', `Called token ${queue.queue_number}`);
      console.log('✅ Audit logged');
    } catch (auditError) {
      console.error('⚠️ Failed to log audit (non-critical):', auditError);
    }

    return {
      success: true,
      message: 'Next person called successfully',
      data: updatedQueue
    };

  } catch (error) {
    console.error('❌ Call next error:', error);
    return {
      success: false,
      message: 'An error occurred while calling next person.'
    };
  }
};

/**
 * Update queue status
 * @param {string} queueId - Queue ID
 * @param {string} status - New status
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} Updated queue entry
 */
export const updateQueueStatus = async (queueId, status, currentUser) => {
  try {
    const validStatuses = ['PENDING', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: 'Invalid status.'
      };
    }

    // Get queue
    const { data: queue } = await supabase
      .from('queue_entries')
      .select('id, institution_id, queue_number, citizen_id')
      .eq('id', queueId)
      .single();

    if (!queue) {
      return {
        success: false,
        message: 'Queue entry not found.'
      };
    }

    // Authorization
    if (['EMPLOYEE', 'INSTITUTION_MANAGER'].includes(currentUser.role)
        && queue.institution_id !== currentUser.institution_id) {
      return {
        success: false,
        message: 'You can only update queues in your institution.'
      };
    }

    // Update status
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'COMPLETED') {
      updateData.completed_at = new Date().toISOString();
      if (!queue.started_at) {
        updateData.started_at = updateData.completed_at;
      }
    } else if (status === 'IN_PROGRESS' && !queue.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    const { data: updatedQueue, error } = await supabase
      .from('queue_entries')
      .update(updateData)
      .eq('id', queueId)
      .select()
      .single();

    if (error) {
      console.error('Update queue status error:', error);
      return {
        success: false,
        message: 'Failed to update queue status.'
      };
    }

    // Notify customer with context-aware message
    const isCompleted = status === 'COMPLETED' || status === 'completed';
    await createNotification({
      recipientId: queue.citizen_id,
      type: 'QUEUE_ASSIGNMENT',
      title: isCompleted ? 'Service Completed' : 'Queue Status Updated',
      message: isCompleted 
        ? `Your service for Token #${queue.queue_number} has been completed. Please rate your experience!`
        : `Your queue entry (Token #${queue.queue_number}) status is now ${status}.`,
      relatedEntityId: queueId,
      relatedEntityType: 'queue'
    });

    // Log audit
    await logAudit(currentUser.id, 'QUEUE_STATUS_UPDATE', `Updated queue token ${queue.queue_number} to ${status}`);

    return {
      success: true,
      message: 'Queue status updated successfully',
      data: updatedQueue
    };

  } catch (error) {
    console.error('Update queue status error:', error);
    return {
      success: false,
      message: 'An error occurred while updating queue status.'
    };
  }
};

/**
 * Get queue status (public endpoint for citizens)
 * @param {string} queueId - Queue ID
 * @returns {Promise<Object>} Queue status
 */
export const getQueueStatus = async (queueId) => {
  try {
    const { data: queue, error } = await supabase
      .from('queue_entries')
      .select(`
        id,
        queue_number,
        institution_id,
        service_id,
        citizen_id,
        priority,
        status,
        created_at,
        started_at,
        services (
          id,
          title_en,
          title_am,
          processing_time
        ),
        institutions (
          id,
          name_en,
          name_am
        )
      `)
      .eq('id', queueId)
      .single();

    if (error || !queue) {
      return {
        success: false,
        message: 'Queue entry not found.'
      };
    }

    const liveInfo = await calculateQueuePositionAndEstimate(queue);

    return {
      success: true,
      data: {
        ...queue,
        position: (queue.status === 'PENDING' || queue.status === 'WAITING') ? liveInfo.people_ahead + 1 : (queue.status === 'IN_PROGRESS' ? 1 : null),
        people_ahead: liveInfo.people_ahead,
        estimated_wait_minutes: liveInfo.estimated_wait_minutes,
        current_serving: liveInfo.current_serving,
        queue_readiness: liveInfo.queue_readiness
      }
    };

  } catch (error) {
    console.error('Get queue status error:', error);
    return {
      success: false,
      message: 'Failed to fetch queue status.'
    };
  }
};



// Helper: Log audit event
const logAudit = async (userId, action, details) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
