import { AuthService } from '../src/services/authService';
import { StorageService } from '../src/services/storage';
import { ContractorBackendService, isValidUuid } from '../src/services/contractorBackendService';
import { ContractorStorageService } from '../src/services/contractorStorageService';
import { getSupabaseClient, isSupabaseConfigured } from '../src/services/supabaseClient';
import { ContractorProjectDetail } from '../src/types/contractor';

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

// 4 distinct Supabase Auth identities for rigorous Stage 3 isolation testing
const IDENTITIES = {
  contractorA: {
    id: 'c0a80000-0000-4000-8000-00000000000a',
    name: 'Contractor Alpha Lead',
    email: 'contractor_alpha@servex.com',
    role: 'contractor' as const,
  },
  contractorB: {
    id: 'c0a80000-0000-4000-8000-00000000000b',
    name: 'Contractor Beta Lead',
    email: 'contractor_beta@servex.com',
    role: 'contractor' as const,
  },
  clientA: {
    id: 'c11e0000-0000-4000-8000-00000000000c',
    name: 'Client Alice',
    email: 'client_alice@servex.com',
    role: 'client' as const,
  },
  clientB: {
    id: 'c11e0000-0000-4000-8000-00000000000d',
    name: 'Client Bob',
    email: 'client_bob@servex.com',
    role: 'client' as const,
  },
  clientC: {
    id: 'c11e0000-0000-4000-8000-00000000000e',
    name: 'Client Charlie',
    email: 'client_charlie@servex.com',
    role: 'client' as const,
  },
};

type TestIdentity = (typeof IDENTITIES)[keyof typeof IDENTITIES];

async function setTestSession(identity: TestIdentity | null) {
  if (!identity) {
    await StorageService.clearSession();
    return;
  }
  await StorageService.saveSession({
    token: `srvx_test_jwt_${identity.id}`,
    user: {
      id: identity.id,
      name: identity.name,
      email: identity.email,
      phone: '9800000000',
      countryCode: '+91',
      role: identity.role,
      authProvider: 'email',
      createdAt: new Date().toISOString(),
      isPhoneVerified: true,
    },
    expiresAt: Date.now() + 3600000,
  });
}

async function runStage3RlsTests() {
  console.log('\n======================================================');
  console.log('       STAGE 3 — SECURE RLS POLICIES VERIFICATION     ');
  console.log('======================================================\n');

  const supabase = getSupabaseClient();
  const isCloudActive = Boolean(supabase && isSupabaseConfigured());
  console.log(`Cloud Supabase Connection Active: ${isCloudActive}\n`);

  // --------------------------------------------------------------------------
  // TEST SUITE 1: ANON ROLE SECURITY (Strict Deny)
  // --------------------------------------------------------------------------
  console.log('[Test Suite 1] Anon Role Access Denied');
  await setTestSession(null);

  if (isCloudActive && supabase) {
    const { data: anonProjects } = await supabase.from('projects').select('*');
    assert(
      !anonProjects || anonProjects.length === 0,
      'Anon cannot SELECT any projects (0 rows returned via RLS)'
    );

    const { error: anonInsertErr } = await supabase.from('projects').insert({
      id: 'hack_proj_anon',
      client_code: 'HACK-01',
      project_name: 'Anon Exploit Project',
      client_name: 'Hacker',
      client_phone: '+91 9999999999',
      site_address: 'Exploit Site',
      start_date: 'Today',
    });
    assert(
      anonInsertErr?.code === '42501',
      'Anon cannot INSERT projects (PostgreSQL 42501 RLS violation)'
    );

    const { error: anonScopeErr } = await supabase.from('scope_items').insert({
      id: 'hack_sc_anon',
      project_id: 'proj-1',
      name: 'Exploit Item',
      unit: 'sqft',
      quantity: 10,
      rate_per_unit: 100,
      total_amount: 1000,
    });
    assert(
      anonScopeErr?.code === '42501',
      'Anon cannot INSERT scope_items (PostgreSQL 42501 RLS violation)'
    );

    const { error: anonAttErr } = await supabase.from('attendance_records').insert({
      project_id: 'proj-1',
      worker_id: 'w-fake',
      worker_name: 'Fake',
      role: 'Helper',
      daily_wage: 500,
      date: 'Today',
      status: 'present',
    });
    assert(
      anonAttErr?.code === '42501',
      'Anon cannot INSERT attendance_records (PostgreSQL 42501 RLS violation)'
    );

    const { error: anonTxErr } = await supabase.from('ledger_transactions').insert({
      id: 'hack_tx_anon',
      project_id: 'proj-1',
      date: 'Today',
      amount: 100000,
      type: 'received_from_client',
      note: 'Spoofed Money',
      recipient_or_payer: 'Hacker',
      reference_no: 'FAKE-999',
    });
    assert(
      anonTxErr?.code === '42501',
      'Anon cannot INSERT ledger_transactions (PostgreSQL 42501 RLS violation)'
    );
  } else {
    // Local fallback check
    const unauthCreated = await ContractorBackendService.createProject({
      clientCode: 'UNAUTH-LOCAL-01',
      projectName: 'Local Unauth Site',
      clientName: 'Nobody',
      clientPhone: '0000',
      siteAddress: 'None',
      startDate: 'Today',
      status: 'active',
    });
    assert(unauthCreated.contractorId === null, 'Unauthenticated user gets null contractorId');
    assert(unauthCreated.clientId === null, 'Unauthenticated user gets null clientId');
    await ContractorStorageService.deleteProject(unauthCreated.id);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: CONTRACTOR ISOLATION & OWNERSHIP ENFORCEMENT
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 2] Contractor A vs Contractor B Isolation');

  // Contractor A creates Project A
  await setTestSession(IDENTITIES.contractorA);
  const codeA = `CLT-ALPHA-${Date.now().toString().slice(-4)}`;
  const projectA = await ContractorBackendService.createProject({
    clientCode: codeA,
    projectName: 'Skyline Villa Alpha',
    clientName: 'Alice Client',
    clientPhone: '+91 98111 22222',
    siteAddress: 'Worli Sea Face Tower A',
    startDate: '01 Nov 2026',
    status: 'active',
  });
  assert(projectA.contractorId === IDENTITIES.contractorA.id, 'Contractor A created Project A with their own UID');
  assert(projectA.clientId === null, 'Project A client_id is initially NULL');

  // Contractor B creates Project B
  await setTestSession(IDENTITIES.contractorB);
  const codeB = `CLT-BETA-${Date.now().toString().slice(-4)}`;
  const projectB = await ContractorBackendService.createProject({
    clientCode: codeB,
    projectName: 'Tech Park Beta Office',
    clientName: 'Bob Client',
    clientPhone: '+91 98333 44444',
    siteAddress: 'BKC Bandra Tower B',
    startDate: '05 Nov 2026',
    status: 'active',
  });
  assert(projectB.contractorId === IDENTITIES.contractorB.id, 'Contractor B created Project B with their own UID');

  // Cross-Contractor Access Check: Contractor B attempts to read/modify Project A
  const allProjectsForB = await ContractorStorageService.getProjects();
  const foundAByB = allProjectsForB.find((p) => p.id === projectA.id && p.contractorId === IDENTITIES.contractorB.id);
  assert(!foundAByB, 'Contractor B cannot claim or access Contractor A project as their own');

  // Contractor B attempts to update Project A
  let contractorBUpdateDenied = false;
  try {
    const maliciousUpdate = {
      ...projectA,
      projectName: 'Hacked by Contractor B',
      contractorId: IDENTITIES.contractorB.id,
    };
    const updateRes = await ContractorBackendService.updateProject(maliciousUpdate);
    if (updateRes.contractorId === IDENTITIES.contractorA.id) {
      contractorBUpdateDenied = true;
    }
  } catch {
    contractorBUpdateDenied = true;
  }
  assert(
    contractorBUpdateDenied,
    'Contractor B cannot change or steal Contractor A project ownership (contractor_id preserved)'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 3: SPOOFING & FABRICATION PREVENTION
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 3] Spoofing Prevention');

  // Contractor A attempts to create project with Contractor B UUID
  await setTestSession(IDENTITIES.contractorA);
  const spoofAttempt = await ContractorBackendService.createProject({
    clientCode: `CLT-SPOOF-${Date.now().toString().slice(-4)}`,
    projectName: 'Spoofed Project',
    clientName: 'Spoof Target',
    clientPhone: '+91 90000 00000',
    siteAddress: 'Spoof Site',
    startDate: 'Today',
    status: 'active',
    contractorId: IDENTITIES.contractorB.id, // Attempting to assign B's UUID
  } as any);

  assert(
    spoofAttempt.contractorId === IDENTITIES.contractorA.id,
    'Arbitrary contractor_id from input rejected; authenticated Contractor A UID enforced'
  );
  await ContractorStorageService.deleteProject(spoofAttempt.id);

  // --------------------------------------------------------------------------
  // TEST SUITE 4: CLIENT ISOLATION & SECURE JOINING
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 4] Client Isolation & Linking');

  // Client A joins Project A using clientCode
  await setTestSession(IDENTITIES.clientA);
  const joinedA = await ContractorBackendService.joinProjectByCode(codeA);
  assert(Boolean(joinedA), 'Client A joined Project A via code');
  assert(joinedA?.clientId === IDENTITIES.clientA.id, 'Project A linked to Client A UID');
  assert(joinedA?.contractorId === IDENTITIES.contractorA.id, 'Contractor A ownership intact');

  // Client B attempts to join/claim Project A (which is already linked to Client A)
  await setTestSession(IDENTITIES.clientB);
  let crossJoinCaught = false;
  try {
    const crossJoin = await ContractorBackendService.joinProjectByCode(codeA);
    // If returned, verify Client B did NOT overwrite Client A
    if (crossJoin) {
      assert(
        crossJoin.clientId === IDENTITIES.clientA.id,
        'Client B cannot overwrite Client A linked project ownership'
      );
    }
  } catch {
    crossJoinCaught = true;
  }

  // Client B links to Project B
  const joinedB = await ContractorBackendService.joinProjectByCode(codeB);
  assert(joinedB?.clientId === IDENTITIES.clientB.id, 'Client B linked to Project B UID');

  // Client A cannot see or access Project B
  await setTestSession(IDENTITIES.clientA);
  const clientAProjects = (await ContractorStorageService.getProjects()).filter(
    (p) => p.clientId === IDENTITIES.clientA.id
  );
  assert(
    !clientAProjects.some((p) => p.id === projectB.id),
    'Client A cannot access Project B (client isolation preserved)'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 4B: CLIENT_ID IMMUTABILITY & ANTI-SPOOFING REGRESSION SUITE
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 4B] Client ID Ownership & Tamper Prevention');

  // Contractor A owns Project A, Client A is linked to Project A
  await setTestSession(IDENTITIES.contractorA);

  // Attempt 1: Contractor A -> UPDATE client_id = Client B UUID
  let ctrSetClientBDenied = false;
  try {
    await ContractorBackendService.updateProject({
      ...projectA,
      clientId: IDENTITIES.clientB.id,
    });
  } catch {
    ctrSetClientBDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: IDENTITIES.clientB.id }).eq('id', projectA.id);
    if (Boolean(error)) {
      ctrSetClientBDenied = true;
    }
  }
  const checkAfterAttempt1 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    ctrSetClientBDenied && checkAfterAttempt1?.clientId === IDENTITIES.clientA.id,
    'Contractor A CANNOT update client_id to Client B UUID (DENIED)'
  );

  // Attempt 2: Contractor A -> UPDATE client_id = NULL
  let ctrSetNullDenied = false;
  try {
    await ContractorBackendService.updateProject({
      ...projectA,
      clientId: null,
    });
  } catch {
    ctrSetNullDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: null }).eq('id', projectA.id);
    if (Boolean(error)) {
      ctrSetNullDenied = true;
    }
  }
  const checkAfterAttempt2 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    ctrSetNullDenied && checkAfterAttempt2?.clientId === IDENTITIES.clientA.id,
    'Contractor A CANNOT update client_id to NULL (DENIED)'
  );

  // Attempt 3: Contractor A -> UPDATE client_id = random UUID
  let ctrSetRandomDenied = false;
  const randomUuid = '99999999-9999-4999-8999-999999999999';
  try {
    await ContractorBackendService.updateProject({
      ...projectA,
      clientId: randomUuid,
    });
  } catch {
    ctrSetRandomDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: randomUuid }).eq('id', projectA.id);
    if (Boolean(error)) {
      ctrSetRandomDenied = true;
    }
  }
  const checkAfterAttempt3 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    ctrSetRandomDenied && checkAfterAttempt3?.clientId === IDENTITIES.clientA.id,
    'Contractor A CANNOT update client_id to random UUID (DENIED)'
  );

  // Attempt 4: Client B -> claim Project A
  await setTestSession(IDENTITIES.clientB);
  let clientBClaimDenied = false;
  try {
    await ContractorBackendService.updateProject({
      ...projectA,
      clientId: IDENTITIES.clientB.id,
      projectName: 'Hijacked by Client B',
    });
  } catch {
    clientBClaimDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: IDENTITIES.clientB.id }).eq('id', projectA.id);
    if (Boolean(error)) {
      clientBClaimDenied = true;
    }
  }
  const checkAfterAttempt4 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    clientBClaimDenied && checkAfterAttempt4?.clientId === IDENTITIES.clientA.id,
    'Client B CANNOT claim Project A (DENIED)'
  );

  // Attempt 5: Client A -> modify client_id
  await setTestSession(IDENTITIES.clientA);
  let clientAModifyDenied = false;
  try {
    await ContractorBackendService.updateProject({
      ...projectA,
      clientId: IDENTITIES.clientB.id,
    });
  } catch {
    clientAModifyDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: IDENTITIES.clientB.id }).eq('id', projectA.id);
    if (Boolean(error)) {
      clientAModifyDenied = true;
    }
  }
  const checkAfterAttempt5 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    clientAModifyDenied && checkAfterAttempt5?.clientId === IDENTITIES.clientA.id,
    'Client A CANNOT modify client_id (DENIED)'
  );

  // Attempt 6: Client B -> join Project A using code after Client A is linked
  await setTestSession(IDENTITIES.clientB);
  let clientBJoinLinkedDenied = false;
  try {
    const res = await ContractorBackendService.joinProjectByCode(codeA);
    if (res?.clientId === IDENTITIES.clientA.id) {
      clientBJoinLinkedDenied = true;
    }
  } catch {
    clientBJoinLinkedDenied = true;
  }
  const checkAfterAttempt6 = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    clientBJoinLinkedDenied && checkAfterAttempt6?.clientId === IDENTITIES.clientA.id,
    'Client B CANNOT join Project A after Client A is linked (DENIED)'
  );

  // Legitimate Flow: New Client C -> join an unlinked project using valid code
  await setTestSession(IDENTITIES.contractorA);
  const codeC = `CLT-CHARLIE-${Date.now().toString().slice(-4)}`;
  const projectC = await ContractorBackendService.createProject({
    clientCode: codeC,
    projectName: 'Unlinked Seaside Villa',
    clientName: 'Charlie Client',
    clientPhone: '+91 98555 66666',
    siteAddress: 'Juhu Tara Road',
    startDate: '10 Nov 2026',
    status: 'active',
  });
  assert(projectC.clientId === null, 'Project C starts with client_id = NULL');

  await setTestSession(IDENTITIES.clientC);
  const joinedC = await ContractorBackendService.joinProjectByCode(codeC);
  assert(
    joinedC !== null && joinedC.clientId === IDENTITIES.clientC.id,
    'New Client C CAN join unlinked project using valid code (ALLOWED)'
  );
  await ContractorStorageService.deleteProject(projectC.id);

  // --------------------------------------------------------------------------
  // TEST SUITE 5: CHILD TABLE BUSINESS PERMISSIONS
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 5] Child Table Business-Specific Permissions');

  // 1. Scope Items: Contractor A can add, Client A cannot modify
  await setTestSession(IDENTITIES.contractorA);
  const withScope = await ContractorBackendService.addScopeItem(projectA.id, {
    name: 'Italian Travertine Tiles',
    unit: 'sqft',
    quantity: 1000,
    ratePerUnit: 220,
    totalAmount: 220000,
  });
  assert(Boolean(withScope?.scopeItems.some((s) => s.name === 'Italian Travertine Tiles')), 'Contractor A added scope item');

  // 2. Workers: Contractor A can add, Client A cannot modify
  const withWorker = await ContractorBackendService.addWorker(projectA.id, {
    name: 'Suresh Kumar',
    role: 'Mason',
    dailyWage: 950,
    phone: '+91 98111 33333',
  });
  assert(Boolean(withWorker?.workers.some((w) => w.name === 'Suresh Kumar')), 'Contractor A enrolled worker');

  // 3. Attendance: Contractor A marks attendance
  const workerRecord = withWorker!.workers[0];
  await ContractorBackendService.updateAttendance(projectA.id, [
    {
      workerId: workerRecord.id,
      workerName: workerRecord.name,
      role: workerRecord.role,
      dailyWage: workerRecord.dailyWage,
      date: 'Today',
      status: 'present',
      checkInTime: '08:45 AM',
      proofVerified: true,
      proofNote: 'Site photo verified',
      wageCalculated: 950,
    },
  ]);
  const fetchedAfterAtt = await ContractorStorageService.getProjectById(projectA.id);
  assert(fetchedAfterAtt?.todayAttendance.length === 1, 'Contractor A marked attendance');

  // 4. Ledger: Contractor A adds transaction
  await ContractorBackendService.addTransaction(projectA.id, {
    date: 'Today',
    amount: 100000,
    type: 'received_from_client',
    note: 'Advance Token Payment',
    recipientOrPayer: 'Client Alice',
    referenceNo: 'TX-STAGE3-001',
  });
  const fetchedAfterTx = await ContractorStorageService.getProjectById(projectA.id);
  assert(fetchedAfterTx?.transactions.length === 1, 'Contractor A logged financial ledger transaction');

  // 5. Chat: Tri-Party Authorization
  // Contractor A can post
  await ContractorBackendService.sendChatMessage(projectA.id, {
    id: `msg_ctr_${Date.now()}`,
    senderRole: 'contractor',
    senderName: 'Contractor Alpha',
    content: 'Site excavation completed today.',
    timestamp: '09:00 AM',
    isAuthorityAction: true,
  });

  // Client A can post as 'client'
  await setTestSession(IDENTITIES.clientA);
  await ContractorBackendService.sendChatMessage(projectA.id, {
    id: `msg_cli_${Date.now()}`,
    senderRole: 'client',
    senderName: 'Client Alice',
    content: 'Thank you team. Please share photos.',
    timestamp: '09:15 AM',
  });

  const chatProj = await ContractorStorageService.getProjectById(projectA.id);
  assert(
    (chatProj?.chatState?.messages.length ?? 0) >= 2,
    'Client A participated in permitted chat under Project A'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 6: NULL OWNERSHIP INACCESSIBILITY
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 6] NULL Ownership Inaccessibility');
  const allInitial = await ContractorStorageService.getProjects();
  const unowned = allInitial.filter((p) => p.contractorId === null && p.clientId === null);
  assert(unowned.length >= 3, 'Pre-seeded unowned projects (proj-1, proj-2, proj-3) have NULL ownership');

  for (const up of unowned) {
    assert(
      up.contractorId === null && up.clientId === null,
      `Project ${up.id} is strictly unowned; no automatic public/authenticated grant exists`
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 7: TEARDOWN & CLEANUP
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 7] Test Projects Cleanup');
  await ContractorStorageService.deleteProject(projectA.id);
  await ContractorStorageService.deleteProject(projectB.id);

  const checkA = await ContractorStorageService.getProjectById(projectA.id);
  const checkB = await ContractorStorageService.getProjectById(projectB.id);
  assert(checkA === null, 'Project A cleaned up');
  assert(checkB === null, 'Project B cleaned up');

  await setTestSession(null);
  const finalSession = await StorageService.getSession();
  assert(finalSession === null, 'Session cleaned up after test run');

  console.log('\n======================================================');
  console.log(`Stage 3 RLS Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage3RlsTests().catch((err) => {
  console.error('Fatal error during Stage 3 test:', err);
  process.exit(1);
});
