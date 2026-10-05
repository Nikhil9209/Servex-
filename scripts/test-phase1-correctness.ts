/**
 * Phase 1 — Backend Correctness & Data Integrity Test Suite
 *
 * Verifies all 9 Phase 1 requirements:
 * 1. deleteScopeItem cloud sync
 * 2. deleteWorker cloud sync
 * 3. Scope quantity / over-completion validation
 * 4. Atomic submit_daily_work_audit PostgreSQL RPC
 * 5. Transaction delete / void
 * 6. Server-authoritative financial aggregates
 * 7. Project deletion / archival cloud sync
 * 8. Client project-code joining flow
 * 9. Realtime linked-project updates
 */

declare const require: any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

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

async function runPhase1CorrectnessTests() {
  console.log('\n======================================================');
  console.log('   PHASE 1: BACKEND CORRECTNESS & DATA INTEGRITY      ');
  console.log('======================================================\n');

  const { AuthService } = require('../src/services/authService');
  const { ContractorBackendService } = require('../src/services/contractorBackendService');
  const { ContractorStorageService } = require('../src/services/contractorStorageService');
  const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20261005_phase1_backend_correctness.sql'),
    'utf8'
  );
  const backendSrc = fs.readFileSync(
    path.join(__dirname, '../src/services/contractorBackendService.ts'),
    'utf8'
  );
  const contextSrc = fs.readFileSync(
    path.join(__dirname, '../src/context/ContractorContext.tsx'),
    'utf8'
  );
  const clientHomeSrc = fs.readFileSync(
    path.join(__dirname, '../src/screens/client/ClientHomeScreen.tsx'),
    'utf8'
  );
  const contractorHomeSrc = fs.readFileSync(
    path.join(__dirname, '../src/screens/contractor/ContractorHomeScreen.tsx'),
    'utf8'
  );

  // Login as contractor for setup
  await AuthService.logout();
  const contractorLogin = await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  const contractorUid = contractorLogin.user.id;

  // Create a clean test project
  const testProject = await ContractorBackendService.createProject({
    clientCode: 'P1-TEST-001',
    projectName: 'Phase 1 Integrity Test Site',
    clientName: 'Rahul Mehra',
    clientPhone: '+91 98200 99999',
    siteAddress: 'Worli Tower A, Mumbai',
    startDate: '05 Oct 2026',
    status: 'active',
  });
  const projectId = testProject.id;

  // -----------------------------------------------------------
  // TASK 1: deleteScopeItem cloud sync
  // -----------------------------------------------------------
  console.log('[Task 1] deleteScopeItem cloud sync');
  assert(typeof ContractorBackendService.deleteScopeItem === 'function', 'deleteScopeItem exists on backend service');
  assert(typeof ContractorStorageService.deleteScopeItem === 'function', 'deleteScopeItem exists on storage service');

  // Add scope item
  const withScope = await ContractorBackendService.addScopeItem(projectId, {
    name: 'Italian Marble Flooring',
    unit: 'sqft',
    quantity: 100,
    ratePerUnit: 200,
    totalAmount: 20000,
  });
  const addedItem = withScope?.scopeItems.find((s: any) => s.name === 'Italian Marble Flooring');
  assert(Boolean(addedItem), 'Scope item added for deletion test');

  // Contractor deletes scope item
  await ContractorBackendService.deleteScopeItem(projectId, addedItem.id);
  const projectAfterScopeDelete = await ContractorStorageService.getProjectById(projectId);
  assert(
    !projectAfterScopeDelete?.scopeItems.some((s: any) => s.id === addedItem.id),
    'Scope item removed from local/cloud project state'
  );

  // Client unauthorized check
  await AuthService.logout();
  await AuthService.loginWithEmail('client@servex.com', 'Servex@2026');
  let clientDeleteBlocked = false;
  try {
    await ContractorBackendService.deleteScopeItem(projectId, 'fake-id');
  } catch (err: any) {
    clientDeleteBlocked = err.message.includes('Unauthorized');
  }
  assert(clientDeleteBlocked, 'Client is blocked from deleting scope items');

  // Relogin as contractor
  await AuthService.logout();
  await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');

  // -----------------------------------------------------------
  // TASK 2: deleteWorker cloud sync
  // -----------------------------------------------------------
  console.log('\n[Task 2] deleteWorker cloud sync');
  assert(typeof ContractorBackendService.deleteWorker === 'function', 'deleteWorker exists on backend service');
  assert(typeof ContractorStorageService.deleteWorker === 'function', 'deleteWorker exists on storage service');

  // Add worker and attendance
  const withWorker = await ContractorBackendService.addWorker(projectId, {
    name: 'Suresh Kumar',
    role: 'Mason',
    dailyWage: 900,
    phone: '+91 98333 44444',
  });
  const addedWorker = withWorker?.workers.find((w: any) => w.name === 'Suresh Kumar');
  assert(Boolean(addedWorker), 'Worker added for deletion test');

  await ContractorBackendService.updateAttendance(projectId, [
    {
      workerId: addedWorker.id,
      workerName: addedWorker.name,
      role: addedWorker.role,
      dailyWage: addedWorker.dailyWage,
      date: 'Today',
      status: 'present',
      checkInTime: '08:45 AM',
      proofVerified: true,
      proofNote: 'Muster biometric ok',
      wageCalculated: 900,
    },
  ]);

  // Delete worker
  await ContractorBackendService.deleteWorker(projectId, addedWorker.id);
  const projectAfterWorkerDelete = await ContractorStorageService.getProjectById(projectId);
  assert(
    !projectAfterWorkerDelete?.workers.some((w: any) => w.id === addedWorker.id),
    'Worker removed from active roster'
  );
  assert(
    projectAfterWorkerDelete?.todayAttendance.some((a: any) => a.workerId === addedWorker.id),
    'Historical attendance records preserved after worker deletion'
  );

  // -----------------------------------------------------------
  // TASK 3: Scope quantity / over-completion validation
  // -----------------------------------------------------------
  console.log('\n[Task 3] Scope quantity / over-completion validation');
  assert(
    schemaSql.includes('chk_scope_completed_le_quantity') ||
      schemaSql.includes('completed_quantity <= quantity') ||
      migrationSql.includes('chk_scope_completed_le_quantity'),
    'Database constraint completed_quantity <= quantity defined'
  );

  // Add a scope item with quantity = 100
  const targetScope = await ContractorBackendService.addScopeItem(projectId, {
    name: 'Gypsum False Ceiling',
    unit: 'sqft',
    quantity: 100,
    ratePerUnit: 150,
    totalAmount: 15000,
  });
  const ceilingItem = targetScope?.scopeItems.find((s: any) => s.name === 'Gypsum False Ceiling');
  assert(Boolean(ceilingItem), 'Scope item for over-completion test added (qty=100)');

  // Attempt 1: 50 completed -> allowed
  const report50 = await ContractorBackendService.saveDailyReport(projectId, {
    id: `rep-${Date.now()}-1`,
    date: '05 Oct 2026',
    supervisorSignature: 'Rajesh Contractor',
    notes: '50 units completed',
    verified: true,
    items: [{ scopeItemId: ceilingItem.id, scopeItemName: ceilingItem.name, qtyDoneToday: 50, ratePerUnit: 150 }],
  });
  const pAfter50 = await ContractorStorageService.getProjectById(projectId);
  const itemAfter50 = pAfter50?.scopeItems.find((s: any) => s.id === ceilingItem.id);
  assert(itemAfter50?.completedQuantity === 50, 'Completed quantity = 50 allowed (50 <= 100)');

  // Attempt 2: 50 more completed -> total 100 -> allowed
  const report100 = await ContractorBackendService.saveDailyReport(projectId, {
    id: `rep-${Date.now()}-2`,
    date: '05 Oct 2026',
    supervisorSignature: 'Rajesh Contractor',
    notes: 'Remaining 50 units completed',
    verified: true,
    items: [{ scopeItemId: ceilingItem.id, scopeItemName: ceilingItem.name, qtyDoneToday: 50, ratePerUnit: 150 }],
  });
  const pAfter100 = await ContractorStorageService.getProjectById(projectId);
  const itemAfter100 = pAfter100?.scopeItems.find((s: any) => s.id === ceilingItem.id);
  assert(itemAfter100?.completedQuantity === 100, 'Completed quantity = 100 allowed (100 <= 100)');

  // Attempt 3: 1 more completed -> total 101 -> REJECTED
  let overCompletionRejected = false;
  try {
    await ContractorBackendService.saveDailyReport(projectId, {
      id: `rep-${Date.now()}-3`,
      date: '05 Oct 2026',
      supervisorSignature: 'Rajesh Contractor',
      notes: '1 more unit',
      verified: true,
      items: [{ scopeItemId: ceilingItem.id, scopeItemName: ceilingItem.name, qtyDoneToday: 1, ratePerUnit: 150 }],
    });
  } catch (err: any) {
    overCompletionRejected = err.message.includes('exceed agreed');
  }
  assert(overCompletionRejected, 'Over-completion rejected: completed (101) > quantity (100)');

  // -----------------------------------------------------------
  // TASK 4: Atomic submit_daily_work_audit RPC
  // -----------------------------------------------------------
  console.log('\n[Task 4] Atomic submit_daily_work_audit RPC');
  assert(
    schemaSql.includes('submit_daily_work_audit') && migrationSql.includes('submit_daily_work_audit'),
    'submit_daily_work_audit function defined in schema & migrations'
  );
  assert(
    migrationSql.includes('SECURITY DEFINER') && migrationSql.includes('search_path = public'),
    'submit_daily_work_audit has pinned search_path and SECURITY DEFINER'
  );
  assert(
    backendSrc.includes("supabase.rpc('submit_daily_work_audit'"),
    'ContractorBackendService invokes submit_daily_work_audit RPC'
  );
  assert(
    schemaSql.includes('FOR UPDATE') && schemaSql.includes('RAISE EXCEPTION'),
    'RPC uses row-locking and atomic rollback semantics'
  );

  // -----------------------------------------------------------
  // TASK 5: Transaction delete / void
  // -----------------------------------------------------------
  console.log('\n[Task 5] Transaction delete / void');
  assert(
    schemaSql.includes('is_voided') && schemaSql.includes('void_reason'),
    'Schema has is_voided, void_reason, voided_at columns'
  );
  assert(
    schemaSql.includes('void_ledger_transaction') && migrationSql.includes('void_ledger_transaction'),
    'void_ledger_transaction RPC defined'
  );
  assert(typeof ContractorBackendService.voidTransaction === 'function', 'voidTransaction in ContractorBackendService');
  assert(typeof ContractorStorageService.voidTransaction === 'function', 'voidTransaction in ContractorStorageService');

  // Add ledger transaction
  const txProject = await ContractorBackendService.addTransaction(projectId, {
    date: '05 Oct 2026',
    amount: 50000,
    type: 'received_from_client',
    note: 'Initial advance payment',
    recipientOrPayer: 'Client: Rahul Mehra',
    referenceNo: 'TX-VOID-TEST-01',
  });
  const addedTx = txProject.transactions.find((t: any) => t.referenceNo === 'TX-VOID-TEST-01');
  assert(Boolean(addedTx), 'Transaction logged for void testing');

  // Void transaction
  await ContractorBackendService.voidTransaction(projectId, addedTx.id, 'Wrong invoice reference entered');
  const pAfterVoid = await ContractorStorageService.getProjectById(projectId);
  const voidedTx = pAfterVoid?.transactions.find((t: any) => t.id === addedTx.id);
  assert(voidedTx?.isVoided === true, 'Transaction marked isVoided = true');
  assert(voidedTx?.voidReason === 'Wrong invoice reference entered', 'Void reason recorded');
  assert(Boolean(voidedTx?.voidedAt), 'Voided timestamp recorded');

  // -----------------------------------------------------------
  // TASK 6: Server-authoritative financial aggregates
  // -----------------------------------------------------------
  console.log('\n[Task 6] Server-authoritative financial aggregates');
  assert(
    schemaSql.includes('get_project_financial_summary') && migrationSql.includes('get_project_financial_summary'),
    'get_project_financial_summary RPC defined in SQL'
  );
  assert(
    typeof ContractorBackendService.getProjectFinancialSummary === 'function',
    'getProjectFinancialSummary in ContractorBackendService'
  );

  // Add valid transaction: Received 100,000 & Paid 40,000
  await ContractorBackendService.addTransaction(projectId, {
    date: '05 Oct 2026',
    amount: 100000,
    type: 'received_from_client',
    note: 'Stage 1 Milestones',
    recipientOrPayer: 'Client: Rahul Mehra',
    referenceNo: 'TX-AUTH-001',
  });
  await ContractorBackendService.addTransaction(projectId, {
    date: '05 Oct 2026',
    amount: 40000,
    type: 'paid_to_worker',
    note: 'Weekly Payroll',
    recipientOrPayer: 'Masonry Workforce',
    referenceNo: 'TX-AUTH-002',
  });

  const finSummary = await ContractorBackendService.getProjectFinancialSummary(projectId);
  assert(finSummary.totalReceived === 100000, 'Total Received = ₹100,000 (excluding voided transaction)');
  assert(finSummary.totalWagesPaid === 40000, 'Total Wages Paid = ₹40,000');
  assert(finSummary.netBalance === 60000, 'Authoritative Net Balance = ₹60,000 (100k - 40k)');

  // -----------------------------------------------------------
  // TASK 7: Project deletion / archival cloud sync
  // -----------------------------------------------------------
  console.log('\n[Task 7] Project deletion / archival cloud sync');
  assert(typeof ContractorBackendService.archiveProject === 'function', 'archiveProject in ContractorBackendService');
  assert(typeof ContractorStorageService.archiveProject === 'function', 'archiveProject in ContractorStorageService');
  assert(
    schemaSql.includes("'archived'") && migrationSql.includes('archive_project'),
    'archive_project RPC and status CHECK include archived'
  );

  await ContractorBackendService.archiveProject(projectId);
  const archivedProject = await ContractorStorageService.getProjectById(projectId);
  assert(archivedProject?.status === 'archived', 'Project status transitioned to archived');
  assert(Boolean(archivedProject?.archivedAt), 'archivedAt timestamp set');

  const allProjects = await ContractorStorageService.getProjects(contractorUid);
  const activeOnly = allProjects.filter((p: any) => p.status === 'active');
  assert(!activeOnly.some((p: any) => p.id === projectId), 'Archived project excluded from active project list');
  assert(allProjects.some((p: any) => p.id === projectId), 'Historical project data preserved in storage');

  // -----------------------------------------------------------
  // TASK 8: Client project-code joining flow
  // -----------------------------------------------------------
  console.log('\n[Task 8] Client project-code joining flow');
  assert(
    clientHomeSrc.includes('joinProjectByCode') && clientHomeSrc.includes('showJoinModal'),
    'ClientHomeScreen provides join project by code UI and modal'
  );
  assert(
    !contractorHomeSrc.includes('joinProjectByCode') && !contractorHomeSrc.includes('showJoinModal'),
    'ContractorHomeScreen no longer has invalid join modal'
  );
  assert(
    schemaSql.includes('IF is_contractor() THEN') &&
      schemaSql.includes('Contractor cannot join project as client'),
    'Database RPC strictly enforces contractors cannot join as clients'
  );
  assert(
    schemaSql.includes('project_code_attempts') && schemaSql.includes('locked_until'),
    'Rate-limiting and lockout protection intact on join attempts'
  );

  // -----------------------------------------------------------
  // TASK 9: Realtime linked-project updates
  // -----------------------------------------------------------
  console.log('\n[Task 9] Realtime linked-project updates');
  assert(
    contextSrc.includes('.channel(') && contextSrc.includes('realtime_projects_'),
    'ContractorContext initializes scoped Realtime subscription'
  );
  assert(
    contextSrc.includes('client_id=eq.') && contextSrc.includes('contractor_id=eq.'),
    'Realtime subscription is scoped by client_id or contractor_id'
  );
  assert(
    contextSrc.includes('supabase.removeChannel(channel)'),
    'Realtime channel clean teardown on unmount / user change'
  );

  // Cleanup test project
  await ContractorStorageService.deleteProject(projectId, contractorUid);

  console.log('\n======================================================');
  console.log(`Phase 1 Verification: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1CorrectnessTests().catch((err) => {
  console.error('Fatal error during Phase 1 correctness tests:', err);
  process.exit(1);
});
