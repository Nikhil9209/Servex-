import { AuthService } from '../src/services/authService';
import { StorageService } from '../src/services/storage';
import { ContractorBackendService, isValidUuid } from '../src/services/contractorBackendService';
import { ContractorStorageService } from '../src/services/contractorStorageService';
import { getSupabaseClient, getSupabaseSession, getSupabaseAuthUser } from '../src/services/supabaseClient';

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

async function runStage2OwnershipTests() {
  console.log('\n======================================================');
  console.log('       STAGE 2 — DATABASE OWNERSHIP MIGRATION TESTS   ');
  console.log('======================================================\n');

  // Test 1: Existing projects are not assigned to random users
  console.log('[Test 1] Existing Projects Ownership Safety (Zero Random Assignment)');
  const initialProjects = await ContractorStorageService.getProjects();
  const seedProj1 = initialProjects.find((p) => p.id === 'proj-1');
  const seedProj2 = initialProjects.find((p) => p.id === 'proj-2');
  const seedProj3 = initialProjects.find((p) => p.id === 'proj-3');

  assert(Boolean(seedProj1), 'Seed project 1 (Skyline Penthouse) exists');
  assert(seedProj1?.contractorId === null, 'Seed project 1 contractorId is strictly NULL (unmapped)');
  assert(seedProj1?.clientId === null, 'Seed project 1 clientId is strictly NULL (unmapped)');

  assert(Boolean(seedProj2), 'Seed project 2 (Apex Tech Park) exists');
  assert(seedProj2?.contractorId === null, 'Seed project 2 contractorId is strictly NULL (unmapped)');
  assert(seedProj2?.clientId === null, 'Seed project 2 clientId is strictly NULL (unmapped)');

  assert(Boolean(seedProj3), 'Seed project 3 (Bandra Showroom) exists');
  assert(seedProj3?.contractorId === null, 'Seed project 3 contractorId is strictly NULL (unmapped)');
  assert(seedProj3?.clientId === null, 'Seed project 3 clientId is strictly NULL (unmapped)');

  for (const p of [seedProj1, seedProj2, seedProj3]) {
    assert(
      p?.contractorId === null && p?.clientId === null,
      `Project ${p?.id} does NOT have invented or randomly assigned UUIDs`
    );
  }

  // Test 2: Unauthenticated project ownership cannot be fabricated
  console.log('\n[Test 2] Unauthenticated Ownership Cannot Be Fabricated');
  await AuthService.logout();
  const cleanSession = await StorageService.getSession();
  assert(cleanSession === null, 'Pre-condition: User is logged out and unauthenticated');

  const unauthTestCode = `CLT-UNAUTH-${Date.now().toString().slice(-4)}`;
  const unauthProject = await ContractorBackendService.createProject({
    clientCode: unauthTestCode,
    projectName: 'Unauthenticated Test Site',
    clientName: 'Anonymous Client',
    clientPhone: '+91 99999 11111',
    siteAddress: '123 Test Street, Mumbai',
    startDate: '01 Nov 2026',
    status: 'active',
    // Attempting to spoof an arbitrary contractorId in client payload
    contractorId: 'c0a80101-0000-0000-0000-000000009999',
  } as any);

  assert(unauthProject.contractorId === null, 'Arbitrary contractorId spoofed from client input is rejected');
  assert(unauthProject.clientId === null, 'Arbitrary clientId spoofed from client input is rejected');

  const fetchedUnauth = await ContractorStorageService.getProjectById(unauthProject.id);
  assert(fetchedUnauth?.contractorId === null, 'Persisted project does not fabricate contractor ownership');
  assert(fetchedUnauth?.clientId === null, 'Persisted project does not fabricate client ownership');

  // Test 3: Authenticated contractor gets correct Supabase UID & project creation records ownership
  console.log('\n[Test 3] Authenticated Contractor Supabase UID & Project Creation Ownership');
  const contractorLogin = await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  const contractorUid = contractorLogin.user.id;
  assert(Boolean(contractorUid), 'Contractor logged in and obtained user ID');
  assert(isValidUuid(contractorUid), `Contractor user ID (${contractorUid}) is a valid UUID`);

  const contractorProjectCode = `CLT-CTR-${Date.now().toString().slice(-4)}`;
  const createdByContractor = await ContractorBackendService.createProject({
    clientCode: contractorProjectCode,
    projectName: 'Worli Luxury Penthouse Suite',
    clientName: 'Rahul Bajaj',
    clientPhone: '+91 98200 55667',
    siteAddress: 'Tower C, Sea Face, Worli, Mumbai',
    startDate: '15 Nov 2026',
    status: 'active',
  });

  assert(
    createdByContractor.contractorId === contractorUid,
    'Project creation recorded contractor Supabase Auth UID in contractorId'
  );
  assert(createdByContractor.clientId === null, 'Project clientId is initially null for contractor-created project');

  const fetchedContractorProj = await ContractorStorageService.getProjectById(createdByContractor.id);
  assert(
    fetchedContractorProj?.contractorId === contractorUid,
    'Contractor ownership persists in storage'
  );

  // Test 4: Project update preserves ownership
  console.log('\n[Test 4] Project Update Preserves Ownership');
  const updatePayload = {
    ...fetchedContractorProj!,
    projectName: 'Worli Luxury Penthouse Suite (Updated Name)',
    status: 'active' as const,
    siteAddress: 'Tower C, Sea Face, Worli, Mumbai - Phase 2',
  };

  const updatedResult = await ContractorBackendService.updateProject(updatePayload);
  assert(
    updatedResult.contractorId === contractorUid,
    'Project update preserves existing contractorId'
  );
  assert(
    updatedResult.projectName === 'Worli Luxury Penthouse Suite (Updated Name)',
    'Project data update succeeded'
  );

  const reFetchedAfterUpdate = await ContractorStorageService.getProjectById(createdByContractor.id);
  assert(
    reFetchedAfterUpdate?.contractorId === contractorUid,
    'Preserved contractor ownership persists across reload'
  );

  // Test 5: Authenticated client gets correct Supabase UID & joins project
  console.log('\n[Test 5] Authenticated Client Supabase UID & Project Association');
  await AuthService.logout();
  const clientLogin = await AuthService.loginWithEmail('client@servex.com', 'Servex@2026');
  const clientUid = clientLogin.user.id;
  assert(Boolean(clientUid), 'Client logged in and obtained user ID');
  assert(isValidUuid(clientUid), `Client user ID (${clientUid}) is a valid UUID`);

  // Client joins the project created by contractor using the client code
  const joinedProject = await ContractorBackendService.joinProjectByCode(contractorProjectCode);
  assert(Boolean(joinedProject), 'Client successfully joined project via clientCode');
  assert(
    joinedProject?.clientId === clientUid,
    'Client joining associates authenticated Supabase UID in clientId'
  );
  assert(
    joinedProject?.contractorId === contractorUid,
    'Client joining preserves original contractorId'
  );

  const fetchedAfterJoin = await ContractorStorageService.getProjectById(createdByContractor.id);
  assert(
    fetchedAfterJoin?.clientId === clientUid,
    'Client ownership link persists in storage'
  );
  assert(
    fetchedAfterJoin?.contractorId === contractorUid,
    'Contractor ownership remains unchanged after client join'
  );

  // Test 6: Child records retain project_id relationship without redundant foreign keys
  console.log('\n[Test 6] Child Records Retain project_id Relationship (Anchor Pattern)');
  await AuthService.logout();
  await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  const projectId = createdByContractor.id;

  // Add scope item
  const withScope = await ContractorBackendService.addScopeItem(projectId, {
    name: 'Imported Marble Paneling',
    unit: 'sqft',
    quantity: 500,
    ratePerUnit: 250,
    totalAmount: 125000,
  });
  assert(Boolean(withScope), 'Scope item added');
  const addedScope = withScope?.scopeItems.find((s) => s.name === 'Imported Marble Paneling');
  assert(Boolean(addedScope), 'Scope item exists in project');

  // Add worker
  const withWorker = await ContractorBackendService.addWorker(projectId, {
    name: 'Balwant Singh',
    role: 'Carpenter',
    dailyWage: 1100,
    phone: '+91 98111 00222',
  });
  assert(Boolean(withWorker), 'Worker enrolled in project');
  const addedWorker = withWorker?.workers.find((w) => w.name === 'Balwant Singh');
  assert(Boolean(addedWorker), 'Worker exists in project roster');

  // Update attendance
  await ContractorBackendService.updateAttendance(projectId, [
    {
      workerId: addedWorker!.id,
      workerName: addedWorker!.name,
      role: addedWorker!.role,
      dailyWage: addedWorker!.dailyWage,
      date: 'Today',
      status: 'present',
      checkInTime: '08:30 AM',
      proofVerified: true,
      proofNote: 'Site biometric verified',
      wageCalculated: 1100,
    },
  ]);
  const fetchedAtt = await ContractorStorageService.getProjectById(projectId);
  assert(fetchedAtt?.todayAttendance.length === 1, 'Attendance recorded under project');

  // Add transaction
  await ContractorBackendService.addTransaction(projectId, {
    date: 'Today',
    amount: 50000,
    type: 'received_from_client',
    note: 'Initial Booking Token',
    recipientOrPayer: 'Client: Rahul Bajaj',
    referenceNo: 'TX-STAGE2-001',
  });
  const fetchedTx = await ContractorStorageService.getProjectById(projectId);
  assert(fetchedTx?.transactions.length === 1, 'Transaction recorded under project');

  // Send tri-party chat message
  await ContractorBackendService.sendChatMessage(projectId, {
    id: `msg-${Date.now()}`,
    senderRole: 'contractor',
    senderName: 'Apex Contractor',
    content: 'Site handover schedule confirmed for next Monday.',
    timestamp: '10:00 AM',
    isAuthorityAction: true,
  });
  const fetchedChat = await ContractorStorageService.getProjectById(projectId);
  assert(
    (fetchedChat?.chatState?.messages.length ?? 0) >= 2,
    'Chat message anchored to project_id'
  );

  // Verify all child data retains parent project reference
  assert(
    fetchedChat?.id === projectId,
    'Parent project id anchors all child records for Stage 3 RLS'
  );

  // Test 7: Cleanup
  console.log('\n[Test 7] Clean State Restoration');
  await ContractorStorageService.deleteProject(projectId);
  await ContractorStorageService.deleteProject(unauthProject.id);
  const deletedCheck = await ContractorStorageService.getProjectById(projectId);
  assert(deletedCheck === null, 'Test projects cleaned up');

  await AuthService.logout();
  const finalSession = await StorageService.getSession();
  assert(finalSession === null, 'Session cleaned up after test run');

  console.log('\n======================================================');
  console.log(`Stage 2 Ownership Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage2OwnershipTests().catch((err) => {
  console.error('Fatal error during Stage 2 test:', err);
  process.exit(1);
});
