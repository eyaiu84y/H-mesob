/**
 * Test ICT Staff viewing their tasks with photos and attachments
 */

async function testICTTaskViewing() {
  try {
    console.log('🧪 Testing ICT staff task viewing with photos...\n');
    
    // Login as ICT staff
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'getahun45@gmail.com',
        password: 'ict123'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Logged in as ICT staff (Getahun Gada)');
    const token = loginData.data.token;
    
    // Fetch tasks
    const tasksRes = await fetch('http://localhost:3000/api/maintenance/my-tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const tasksData = await tasksRes.json();
    console.log('\n📋 Tasks Response:');
    console.log('   Success:', tasksData.success);
    console.log('   Tasks count:', tasksData.data?.length || 0);
    
    if (!tasksData.data || tasksData.data.length === 0) {
      console.log('\n⚠️  No tasks found for this ICT staff');
      console.log('   Make sure Institution Manager has assigned a task first');
      return;
    }
    
    // Show all tasks
    console.log('\n📝 All Tasks:');
    tasksData.data.forEach((task, i) => {
      const report = task.maintenance_reports || {};
      console.log(`\n   ${i + 1}. Task ID: ${task.id}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Title: ${report.title || 'N/A'}`);
      console.log(`      Institution: ${report.institutions?.name_en || 'N/A'}`);
      console.log(`      Priority: ${report.priority || 'N/A'}`);
      console.log(`      Attachments: ${report.maintenance_attachments?.length || 0}`);
    });
    
    // Detail view of first task
    const task = tasksData.data[0];
    const report = task.maintenance_reports || {};
    const attachments = report.maintenance_attachments || [];
    const photo = attachments.find(a => a.file_type?.startsWith('image/'));
    
    console.log('\n🔍 First Task Details:');
    console.log('   ID:', task.id);
    console.log('   Status:', task.status);
    console.log('   Title:', report.title);
    console.log('   Description:', report.description?.substring(0, 100) + '...');
    console.log('   Location:', report.location);
    console.log('   Equipment:', report.equipment_info);
    console.log('   Priority:', report.priority);
    console.log('   Institution:', report.institutions?.name_en);
    
    console.log('\n📎 Attachments:');
    if (attachments.length === 0) {
      console.log('   No attachments found');
    } else {
      attachments.forEach((att, i) => {
        console.log(`   ${i + 1}. ${att.file_name}`);
        console.log(`      Type: ${att.file_type}`);
        console.log(`      Size: ${(att.file_size / 1024).toFixed(1)} KB`);
        console.log(`      URL: ${att.file_url}`);
      });
    }
    
    console.log('\n📷 Photo:');
    if (photo) {
      console.log('   ✅ Photo found:', photo.file_name);
      console.log('   URL:', photo.file_url);
    } else {
      console.log('   ⚠️  No photo attached to this maintenance report');
    }
    
    console.log('\n✅ Test complete!');
    console.log('\n📝 Frontend should display:');
    console.log('   1. Status buttons (Start Task / Complete Task) based on current status');
    console.log('   2. Photo display (if photo exists)');
    console.log('   3. Attachments list with download links');
    console.log('   4. Status workflow: Assigned → In Progress → Completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testICTTaskViewing();
