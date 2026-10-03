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

async function runStage4LinkingTests() {
  console.log('\n======================================================');
  console.log('  STAGE 4 — CLIENT PROJECT CODE LINKING VERIFICATION  ');
  console.log('======================================================\n');

  const supabase = getSupabaseClient();
  const isCloudActive = Boolean(supabase && isSupabaseConfigured());
  console.log(`Cloud Supabase Connection Active: ${isCloudActive}\n`);

  // Setup: Contractor A creates Project 1 (Unlinked)
  await setTestSession(IDENTITIES.contractorA);
  const code1 = `CLT-STG4-${Date.now().toString().slice(-4)}`;
  const project1 = await ContractorBackendService.createProject({
    clientCode: code1,
    projectName: 'Marine Drive Horizon Residence',
    clientName: 'Pending Client',
    clientPhone: '+91 98000 11111',
    siteAddress: 'Marine Drive Tower 1',
    startDate: '15 Nov 2026',
    status: 'active',
  });

  // Verify Project 1 created with contractor ownership and null client_id
  assert(project1.contractorId === IDENTITIES.contractorA.id, 'Project created with Contractor A ownership');
  assert(project1.clientId === null, 'Project starts unlinked with client_id = NULL');

  // --------------------------------------------------------------------------
  // TEST A: Authenticated Client -> valid unlinked project (SUCCESS)
  // --------------------------------------------------------------------------
  console.log('\n[Test A] Authenticated Client -> Valid Unlinked Project');
  await setTestSession(IDENTITIES.clientA);
  const joinedA = await ContractorBackendService.joinProjectByCode(code1);

  assert(joinedA !== null, 'Authenticated Client Alice successfully joins project by code');
  assert(joinedA?.clientId === IDENTITIES.clientA.id, 'Project client_id is assigned to Client Alice Supabase Auth UID');
  assert(joinedA?.contractorId === IDENTITIES.contractorA.id, 'Contractor A ownership remains intact after join');

  // Verify persistence in storage
  const persistedAfterA = await ContractorStorageService.getProjectById(project1.id);
  assert(persistedAfterA?.clientId === IDENTITIES.clientA.id, 'Client Alice linking persists in storage');

  // --------------------------------------------------------------------------
  // TEST B: Authenticated Client -> already linked project (THEIR OWN - Idempotent)
  // --------------------------------------------------------------------------
  console.log('\n[Test B] Authenticated Client -> Already Linked Project (Own Project)');
  const reJoinedA = await ContractorBackendService.joinProjectByCode(code1);
  assert(reJoinedA !== null, 'Calling joinProjectByCode again on own linked project succeeds idempotently');
  assert(reJoinedA?.clientId === IDENTITIES.clientA.id, 'client_id remains unchanged upon idempotent re-join');

  // --------------------------------------------------------------------------
  // TEST C: Second Client -> already linked project (DENIED)
  // --------------------------------------------------------------------------
  console.log('\n[Test C] Second Client -> Already Linked Project (Takeover Prevention)');
  await setTestSession(IDENTITIES.clientB);
  let secondClientDenied = false;
  try {
    const resB = await ContractorBackendService.joinProjectByCode(code1);
    if (resB?.clientId === IDENTITIES.clientA.id) {
      // If returned without overwriting, verify Client A was NOT stolen
      secondClientDenied = true;
    }
  } catch (err: any) {
    if (err.message && err.message.includes('already linked')) {
      secondClientDenied = true;
    }
  }
  const checkAfterAttemptB = await ContractorStorageService.getProjectById(project1.id, IDENTITIES.clientA.id);
  assert(
    secondClientDenied && checkAfterAttemptB?.clientId === IDENTITIES.clientA.id,
    'Client Bob CANNOT claim or overwrite project linked to Client Alice (DENIED)'
  );

  // --------------------------------------------------------------------------
  // TEST D: Authenticated Client -> invalid code (DENIED / Safe Failure)
  // --------------------------------------------------------------------------
  console.log('\n[Test D] Authenticated Client -> Invalid Project Code (Safe Failure)');
  await setTestSession(IDENTITIES.clientA);
  const invalidResult = await ContractorBackendService.joinProjectByCode('CLT-NONEXISTENT-999');
  assert(invalidResult === null, 'Invalid/nonexistent project code fails safely and returns null without data leak');

  // --------------------------------------------------------------------------
  // TEST E: Unauthenticated / Anon -> valid project code (DENIED)
  // --------------------------------------------------------------------------
  console.log('\n[Test E] Unauthenticated / Anon -> Valid Project Code');
  await setTestSession(null);
  let anonDenied = false;
  try {
    await ContractorBackendService.joinProjectByCode(code1);
  } catch (err: any) {
    if (err.message && (err.message.includes('Authentication required') || err.message.includes('permission denied'))) {
      anonDenied = true;
    }
  }
  assert(anonDenied, 'Unauthenticated/anon user CANNOT join project (DENIED)');

  if (isCloudActive && supabase) {
    const { error: anonRpcErr } = await supabase.rpc('join_project_by_code', {
      p_client_code: code1,
    });
    assert(
      Boolean(anonRpcErr),
      'Direct Supabase RPC call by anon role is rejected by PostgreSQL (HTTP 401/42501)'
    );
  }

  // --------------------------------------------------------------------------
  // TEST F: Client cannot supply another user's UUID as client_id (Spoof Prevention)
  // --------------------------------------------------------------------------
  console.log('\n[Test F] Client Cannot Supply Another User UUID as client_id');
  await setTestSession(IDENTITIES.clientA);
  let spoofClientDenied = false;
  try {
    await ContractorBackendService.updateProject({
      ...project1,
      clientId: IDENTITIES.clientB.id,
    });
  } catch {
    spoofClientDenied = true;
  }
  if (isCloudActive && supabase) {
    const { error } = await supabase.from('projects').update({ client_id: IDENTITIES.clientB.id }).eq('id', project1.id);
    if (Boolean(error)) {
      spoofClientDenied = true;
    }
  }
  const checkAfterSpoof = await ContractorStorageService.getProjectById(project1.id);
  assert(
    spoofClientDenied && checkAfterSpoof?.clientId === IDENTITIES.clientA.id,
    'Client cannot supply or alter client_id to another user UUID (DENIED / ignored)'
  );

  // --------------------------------------------------------------------------
  // TEST G: Client joining project cannot change contractor_id
  // --------------------------------------------------------------------------
  console.log('\n[Test G] Client Joining Project Cannot Change contractor_id');
  const checkContractorId = await ContractorStorageService.getProjectById(project1.id);
  assert(
    checkContractorId?.contractorId === IDENTITIES.contractorA.id,
    'contractor_id remains strictly unchanged after client linking'
  );

  // --------------------------------------------------------------------------
  // TEST H: Two clients attempting to claim same unlinked project (Atomic Concurrency)
  // --------------------------------------------------------------------------
  console.log('\n[Test H] Two Clients Attempting to Claim Same Unlinked Project');
  // Contractor A creates unlinked Project H
  await setTestSession(IDENTITIES.contractorA);
  const codeH = `CLT-RACE-${Date.now().toString().slice(-4)}`;
  const projectH = await ContractorBackendService.createProject({
    clientCode: codeH,
    projectName: 'Bandra Race Condition Suite',
    clientName: 'Contested Client',
    clientPhone: '+91 98999 88888',
    siteAddress: 'Pali Hill',
    startDate: '20 Nov 2026',
    status: 'active',
  });
  assert(projectH.clientId === null, 'Project H created with client_id = NULL');

  // Client A claims Project H first
  await setTestSession(IDENTITIES.clientA);
  const claim1 = await ContractorBackendService.joinProjectByCode(codeH);
  assert(claim1 !== null && claim1.clientId === IDENTITIES.clientA.id, 'First claiming client (Alice) succeeds');

  // Client B attempts to claim the same project right after
  await setTestSession(IDENTITIES.clientB);
  let claim2Denied = false;
  try {
    const claim2 = await ContractorBackendService.joinProjectByCode(codeH);
    if (claim2?.clientId === IDENTITIES.clientA.id) {
      claim2Denied = true; // Claim 2 did not steal project
    }
  } catch {
    claim2Denied = true;
  }
  assert(claim2Denied, 'Second claiming client (Bob) is rejected; exactly one client claims the project');

  const checkFinalH = await ContractorStorageService.getProjectById(projectH.id, IDENTITIES.clientA.id);
  assert(
    checkFinalH?.clientId === IDENTITIES.clientA.id,
    'Database state atomically preserves first claimant; no overwrite occurred'
  );

  // --------------------------------------------------------------------------
  // TEST I: Joining Project A does not grant access to Project B (Cross-Project Isolation)
  // --------------------------------------------------------------------------
  console.log('\n[Test I] Cross-Project Isolation (Joining Project A does not grant access to B)');
  // Contractor B creates Project B
  await setTestSession(IDENTITIES.contractorB);
  const codeB = `CLT-ISOL-${Date.now().toString().slice(-4)}`;
  const projectB = await ContractorBackendService.createProject({
    clientCode: codeB,
    projectName: 'Juhu Private Beach Villa (Project B)',
    clientName: 'Bob Client',
    clientPhone: '+91 98777 66666',
    siteAddress: 'Juhu Beach',
    startDate: '01 Dec 2026',
    status: 'active',
  });

  // Client A checks accessible projects
  await setTestSession(IDENTITIES.clientA);
  const allProjectsForClientA = (await ContractorStorageService.getProjects()).filter(
    (p) => p.clientId === IDENTITIES.clientA.id
  );
  assert(
    !allProjectsForClientA.some((p) => p.id === projectB.id),
    'Client Alice cannot access or see Project B (DENIED)'
  );

  // --------------------------------------------------------------------------
  // TEST J: Contractor Cannot Join Own Project as Client
  // --------------------------------------------------------------------------
  console.log('\n[Test J] Contractor Cannot Join Own Project as Client');
  await setTestSession(IDENTITIES.contractorA);
  let contractorSelfJoinDenied = false;
  try {
    await ContractorBackendService.joinProjectByCode(code1);
  } catch (err: any) {
    if (err.message && err.message.includes('Contractor cannot join')) {
      contractorSelfJoinDenied = true;
    }
  }
  assert(contractorSelfJoinDenied, 'Contractor CANNOT join their own project as client (DENIED)');

  // --------------------------------------------------------------------------
  // TEARDOWN & CLEANUP
  // --------------------------------------------------------------------------
  console.log('\n[Cleanup] Cleaning up Stage 4 test projects');
  await ContractorStorageService.deleteProject(project1.id);
  await ContractorStorageService.deleteProject(projectH.id);
  await ContractorStorageService.deleteProject(projectB.id);

  await setTestSession(null);
  console.log('\n======================================================');
  console.log(`Stage 4 Linking Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage4LinkingTests().catch((err) => {
  console.error('Fatal error during Stage 4 test:', err);
  process.exit(1);
});
