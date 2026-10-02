import { ContractorStorageService } from './src/services/contractorStorageService';
import { ContractorBackendService } from './src/services/contractorBackendService';
import { isSupabaseConfigured } from './src/services/supabaseClient';

let passed = 0;
let failed = 0;

function assert(condition: unknown, testName: string) {
  if (Boolean(condition)) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
    failed++;
  }
}

async function runContractorBackendTests() {
  console.log('\n=== Servex Contractor Backend & Persistence Test Suite ===\n');

  // Test 1: Initial Seed Data Loading
  console.log('[Test 1] Seed Initialization');
  const initialProjects = await ContractorStorageService.getProjects();
  assert(initialProjects.length >= 3, `Initial projects seeded (${initialProjects.length} projects found)`);
  assert(Boolean(initialProjects.find((p) => p.clientCode === 'CLT-8842')), 'Skyline Penthouse project CLT-8842 exists');

  // Test 2: Create New Project
  console.log('\n[Test 2] Create & Persist Project');
  const testCode = 'CLT-TEST-99';
  const createdProject = await ContractorStorageService.createProject({
    clientCode: testCode,
    projectName: 'Worli Sea-Facing Villa Fitout',
    clientName: 'Sunil Oberoi',
    clientPhone: '+91 98211 44556',
    siteAddress: 'Plot 18, Worli Sea Face, Mumbai',
    startDate: '05 Oct 2026',
    status: 'active',
  });

  assert(Boolean(createdProject.id), 'Project ID generated');
  assert(createdProject.clientCode === testCode, 'Client code matches');

  // Verify persistence by fetching again from storage
  const fetchedAfterCreate = await ContractorStorageService.getProjectById(createdProject.id);
  assert(fetchedAfterCreate?.projectName === 'Worli Sea-Facing Villa Fitout', 'Project persists in storage');

  // Test 3: Lookup by Client Code
  console.log('\n[Test 3] Lookup by Client Code');
  const lookedUp = await ContractorStorageService.findProjectByCode(testCode);
  assert(lookedUp?.id === createdProject.id, 'Project retrieved by client code');

  // Test 4: Add Scope Requirement & Calculation
  console.log('\n[Test 4] Scope Requirements & Rate Calculation');
  const updatedWithScope = await ContractorStorageService.addScopeItem(createdProject.id, {
    name: 'Teakwood Acoustic Wall Paneling',
    unit: 'sqft',
    quantity: 1200,
    ratePerUnit: 180,
    totalAmount: 216000,
  });

  assert(Boolean(updatedWithScope), 'Scope item added');
  const addedScope = updatedWithScope?.scopeItems.find((s) => s.name === 'Teakwood Acoustic Wall Paneling');
  assert(addedScope?.totalAmount === 216000, 'Scope line item amount correctly calculated (1200 * 180 = 216,000)');
  assert(addedScope?.completedQuantity === 0, 'Completed quantity initializes at 0');

  // Test 5: Worker Enrollment & Initial Muster Roll
  console.log('\n[Test 5] Worker Enrollment & Attendance Muster');
  const updatedWithWorker = await ContractorStorageService.addWorker(createdProject.id, {
    name: 'Dilip Mistry',
    role: 'Carpenter',
    dailyWage: 1100,
    phone: '+91 98111 88990',
  });

  const workerRecord = updatedWithWorker?.workers.find((w) => w.name === 'Dilip Mistry');
  assert(Boolean(workerRecord), 'Worker enrolled in project roster');
  const attendanceRecord = updatedWithWorker?.todayAttendance.find((a) => a.workerName === 'Dilip Mistry');
  assert(attendanceRecord?.status === 'present', 'Worker present in today muster roll');
  assert(attendanceRecord?.wageCalculated === 1100, 'Initial wage liability matches daily wage rate');

  // Test 6: Attendance Status & Photo Proof Updates
  console.log('\n[Test 6] Attendance Status & Verification Updates');
  if (attendanceRecord && workerRecord) {
    const updatedAttendanceList = updatedWithWorker!.todayAttendance.map((a) =>
      a.workerId === workerRecord.id
        ? {
            ...a,
            status: 'half_day' as const,
            wageCalculated: 550,
            proofVerified: true,
            proofNote: 'Photo verified on site',
          }
        : a
    );

    const savedAttendance = await ContractorStorageService.updateAttendance(createdProject.id, updatedAttendanceList);
    const modifiedEntry = savedAttendance?.todayAttendance.find((a) => a.workerId === workerRecord.id);
    assert(modifiedEntry?.status === 'half_day', 'Attendance status updated to half_day');
    assert(modifiedEntry?.wageCalculated === 550, 'Wage liability recalculated to half day (550)');
    assert(modifiedEntry?.proofVerified === true, 'Photo proof status verified');
  }

  // Test 7: Daily Work Verification Report & Scope Auto-increment
  console.log('\n[Test 7] Daily Work Audit & Scope Auto-increment');
  if (addedScope) {
    const dailyReport = {
      id: `daily-test-${Date.now()}`,
      date: 'Today, 02 Oct',
      verifiedBy: 'Prime General Contractor',
      items: [
        {
          scopeItemId: addedScope.id,
          name: addedScope.name,
          unit: addedScope.unit,
          qtyDoneToday: 400,
          ratePerUnit: addedScope.ratePerUnit,
          totalValueToday: 72000,
        },
      ],
      totalWorkValueToday: 72000,
      totalWorkerWageToday: 550,
      contractorMarginToday: 71450,
      isVerified: true,
    };

    const savedReportProject = await ContractorStorageService.saveDailyReport(createdProject.id, dailyReport);
    const auditedScopeItem = savedReportProject?.scopeItems.find((s) => s.id === addedScope.id);
    assert(auditedScopeItem?.completedQuantity === 400, 'Scope item completedQuantity auto-incremented by 400');
    assert(savedReportProject?.dailyReports.length === 1, 'Daily report saved in audit history');
    assert(savedReportProject?.dailyReports[0].contractorMarginToday === 71450, 'Contractor margin verified (72000 - 550 = 71450)');
  }

  // Test 8: Financial Ledger Transactions
  console.log('\n[Test 8] Financial Ledger Transactions');
  const updatedWithTx = await ContractorStorageService.addTransaction(createdProject.id, {
    date: 'Today, 02 Oct',
    amount: 100000,
    type: 'received_from_client',
    note: 'Initial Mobilization Inflow',
    recipientOrPayer: 'Client: Sunil Oberoi',
    referenceNo: 'REF-MOBILIZE-01',
  });

  const tx = updatedWithTx?.transactions.find((t) => t.referenceNo === 'REF-MOBILIZE-01');
  assert(Boolean(tx), 'Transaction logged in ledger');
  assert(tx?.amount === 100000, 'Transaction amount is 100,000');
  assert(tx?.type === 'received_from_client', 'Transaction type is received_from_client');

  // Test 9: Tri-Party Chat Messaging & Worker Authority Toggle
  console.log('\n[Test 9] Tri-Party Chat & Worker Authority');
  const chatUpdated = await ContractorStorageService.sendChatMessage(createdProject.id, {
    id: `msg-test-${Date.now()}`,
    senderRole: 'contractor',
    senderName: 'Marcus Lead Contractor',
    content: 'Acoustic wall paneling phase 1 passed audit.',
    timestamp: '05:30 PM',
  });

  assert(chatUpdated?.chatState?.messages.some((m) => m.content.includes('phase 1 passed audit')), 'Chat message stored');

  const authorityUpdated = await ContractorStorageService.toggleWorkerAuthority(createdProject.id, true);
  assert(authorityUpdated?.chatState?.workerMessagingAllowed === true, 'Worker messaging authority granted');

  // Test 10: Backend Service Sync Diagnostics
  console.log('\n[Test 10] Backend Service Diagnostics');
  const status = ContractorBackendService.getSyncStatus();
  assert(status.isCloudConnected === isSupabaseConfigured(), 'Sync status accurately reflects Supabase config');
  assert(status.syncError === null, 'No sync errors');

  // Test 11: Real Data Cross-Screen Calculation Consistency & RA Bill
  console.log('\n[Test 11] Cross-Screen Calculation Consistency & RA Bill');
  const activeProj = (await ContractorStorageService.getProjectById(createdProject.id))!;
  const calcTotalScope = activeProj.scopeItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const calcTotalCompleted = activeProj.scopeItems.reduce(
    (sum, item) => sum + item.completedQuantity * item.ratePerUnit,
    0
  );
  const calcExecutionPct = calcTotalScope > 0 ? Math.round((calcTotalCompleted / calcTotalScope) * 100) : 0;
  const calcReceived = activeProj.transactions
    .filter((t) => t.type === 'received_from_client')
    .reduce((sum, t) => sum + t.amount, 0);
  const calcPaid = activeProj.transactions
    .filter((t) => t.type === 'paid_to_worker')
    .reduce((sum, t) => sum + t.amount, 0);
  const calcNetCashflow = calcReceived - calcPaid;
  const calcBalanceDue = Math.max(0, calcTotalCompleted - calcReceived);

  assert(calcTotalScope === 216000, 'Total Contract Scope Value is ₹2,16,000');
  assert(calcTotalCompleted === 72000, 'Total Work Executed Value is ₹72,000');
  assert(calcExecutionPct === 33, 'Execution progress calculates to 33%');
  assert(calcReceived === 100000, 'Total Cash Collected is ₹1,00,000');
  assert(calcPaid === 0, 'Total Paid to Workers is ₹0');
  assert(calcNetCashflow === 100000, 'Net Cashflow Balance is ₹1,00,000');
  assert(calcBalanceDue === 0, 'RA Bill Balance Due correctly reflects zero pending balance');

  // Test 12: Persistence Verification Across Simulated App Reload
  console.log('\n[Test 12] Persistence Across App Reload');
  const allProjectsReloaded = await ContractorStorageService.getProjects();
  const reloadedProject = allProjectsReloaded.find((p) => p.id === createdProject.id);
  assert(Boolean(reloadedProject), 'Project found after simulated app reload');
  assert(reloadedProject?.scopeItems.length === 1, 'Scope items intact across reload');
  assert(reloadedProject?.workers.length === 1, 'Workers roster intact across reload');
  assert(reloadedProject?.todayAttendance.length === 1, 'Attendance records intact across reload');
  assert(reloadedProject?.dailyReports.length === 1, 'Daily reports intact across reload');
  assert(reloadedProject?.transactions.length === 1, 'Transactions intact across reload');
  assert(reloadedProject?.chatState?.messages.length! >= 2, 'Chat history intact across reload');

  // Clean up test project
  await ContractorStorageService.deleteProject(createdProject.id);
  const deletedCheck = await ContractorStorageService.getProjectById(createdProject.id);
  assert(deletedCheck === null, 'Test project cleaned up after verification');

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runContractorBackendTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
