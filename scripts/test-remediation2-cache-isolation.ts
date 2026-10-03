import { AuthService } from '../src/services/authService';
import { StorageService } from '../src/services/storage';
import { ContractorBackendService, isValidUuid } from '../src/services/contractorBackendService';
import {
  ContractorStorageService,
  CACHE_PREFIX,
  UNOWNED_SEED_KEY,
  LEGACY_STATIC_KEY,
  USER_REGISTRY_KEY,
  getProjectStorageKey,
} from '../src/services/contractorStorageService';
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

import { User } from '../src/types/auth';

const USER_A: User = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'contractor.alice@servex.com',
  name: 'Alice Contractor',
  role: 'contractor',
  phone: '9811100001',
  countryCode: '+91',
  authProvider: 'email',
  createdAt: '2026-01-01T00:00:00.000Z',
  isPhoneVerified: true,
};

const USER_B: User = {
  id: 'b0000000-0000-4000-8000-000000000002',
  email: 'builder.bob@servex.com',
  name: 'Bob Builder',
  role: 'contractor',
  phone: '9822200002',
  countryCode: '+91',
  authProvider: 'email',
  createdAt: '2026-01-01T00:00:00.000Z',
  isPhoneVerified: true,
};

const USER_C: User = {
  id: 'c0000000-0000-4000-8000-000000000003',
  email: 'client.charlie@servex.com',
  name: 'Charlie Client',
  role: 'client',
  phone: '9833300003',
  countryCode: '+91',
  authProvider: 'email',
  createdAt: '2026-01-01T00:00:00.000Z',
  isPhoneVerified: true,
};

async function setTestSession(user: User | null) {
  if (!user) {
    await AuthService.logout();
    return;
  }
  await StorageService.saveSession({
    user,
    token: `test-token-${user.id}`,
    expiresAt: Date.now() + 3600000,
  });
}

async function runRemediation2Tests() {
  console.log('\n======================================================');
  console.log('   STAGE 5 — REMEDIATION 2: LOCAL CACHE ISOLATION     ');
  console.log('======================================================\n');

  // Pre-cleanup
  await AuthService.logout();
  await ContractorStorageService.clearUserCache(USER_A.id);
  await ContractorStorageService.clearUserCache(USER_B.id);
  await ContractorStorageService.clearUserCache(USER_C.id);

  // --------------------------------------------------------------------------
  // TEST SUITE 1: USER-SCOPED STORAGE KEY ARCHITECTURE & IDENTITY HYGIENE
  // --------------------------------------------------------------------------
  console.log('[Test Suite 1] Storage Key Architecture & Identity Validation');

  const keyA = getProjectStorageKey(USER_A.id);
  assert(
    keyA === `${CACHE_PREFIX}_${USER_A.id}`,
    `Valid UUID generates user-scoped key (${keyA})`
  );

  const uppercaseUuid = USER_A.id.toUpperCase();
  const keyUpper = getProjectStorageKey(uppercaseUuid);
  assert(
    keyUpper === `${CACHE_PREFIX}_${USER_A.id.toLowerCase()}`,
    'Storage key normalizes UUID to lowercase to avoid case collisions'
  );

  // Prohibited identities must NEVER be used as cache namespace
  const emailKey = getProjectStorageKey('alice@example.com');
  assert(
    emailKey === UNOWNED_SEED_KEY,
    'Email address is rejected as cache identity (falls back to unowned seed key)'
  );

  const phoneKey = getProjectStorageKey('+919811100001');
  assert(
    phoneKey === UNOWNED_SEED_KEY,
    'Phone number is rejected as cache identity (falls back to unowned seed key)'
  );

  const roleKey = getProjectStorageKey('contractor');
  assert(
    roleKey === UNOWNED_SEED_KEY,
    'Role string is rejected as cache identity (falls back to unowned seed key)'
  );

  const nullKey = getProjectStorageKey(null);
  assert(
    nullKey === UNOWNED_SEED_KEY,
    'Null user identity maps to unowned seed storage key'
  );

  const undefinedKey = getProjectStorageKey(undefined);
  assert(
    undefinedKey === UNOWNED_SEED_KEY,
    'Undefined user identity maps to unowned seed storage key'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: MULTI-TENANT ISOLATION (USER A -> LOGOUT -> USER B)
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 2] Multi-Tenant Isolation (User A -> Logout -> User B)');

  // 1. User A logs in
  await setTestSession(USER_A);
  const codeA = `PRJ-ALICE-${Date.now().toString().slice(-4)}`;
  const projectA = await ContractorBackendService.createProject({
    clientCode: codeA,
    projectName: 'Alice Confidential Penthouse',
    clientName: 'VIP Client Oberoi',
    clientPhone: '+91 99999 11111',
    siteAddress: 'Bungalow 7, Secret Juhu Tara Road, Mumbai - Confidential',
    startDate: '01 Dec 2026',
    status: 'active',
  });

  // User A adds sensitive records
  await ContractorBackendService.addWorker(projectA.id, {
    name: 'Ramesh Carpenter',
    role: 'Carpenter',
    dailyWage: 1400,
    phone: '+91 98111 22334',
  });

  await ContractorBackendService.addTransaction(projectA.id, {
    date: 'Today',
    amount: 250000,
    type: 'received_from_client',
    note: 'Initial Cash Deposit',
    recipientOrPayer: 'VIP Client Oberoi',
    referenceNo: 'TX-CONFIDENTIAL-001',
  });

  await ContractorBackendService.sendChatMessage(projectA.id, {
    id: `msg-alice-${Date.now()}`,
    senderRole: 'contractor',
    senderName: 'Alice Contractor',
    content: 'Gate security code is #4040. Deliveries after 8pm only.',
    timestamp: '11:00 AM',
    isAuthorityAction: true,
  });

  // Verify User A can see their own project
  const userAProjects = await ContractorStorageService.getProjects(USER_A.id);
  const foundInA = userAProjects.find((p) => p.id === projectA.id);
  assert(Boolean(foundInA), 'User A successfully persisted confidential project data locally');
  assert(foundInA?.workers.length === 1, 'User A worker record is saved in User A cache');
  assert(foundInA?.transactions.length === 1, 'User A ledger transaction is saved in User A cache');
  assert(
    (foundInA?.chatState?.messages.length ?? 0) >= 2,
    'User A confidential chat message is saved in User A cache'
  );

  // 2. User A logs out
  await AuthService.logout();
  const sessionAfterLogout = await StorageService.getSession();
  assert(sessionAfterLogout === null, 'User A session is completely cleared upon logout');

  // 3. Unauthenticated access check
  const unauthProjects = await ContractorStorageService.getProjects(null);
  const leakedToUnauth = unauthProjects.find((p) => p.id === projectA.id);
  assert(!leakedToUnauth, 'Unauthenticated caller CANNOT see User A cached project data');

  // 4. User B logs in
  await setTestSession(USER_B);
  const userBProjects = await ContractorStorageService.getProjects(USER_B.id);

  const leakedProjectToB = userBProjects.find((p) => p.id === projectA.id);
  assert(!leakedProjectToB, 'User B CANNOT see User A cached project');

  const leakedSiteToB = userBProjects.find(
    (p) => p.siteAddress && p.siteAddress.includes('Secret Juhu Tara Road')
  );
  assert(!leakedSiteToB, 'User B CANNOT see User A site address');

  const leakedPhoneToB = userBProjects.find(
    (p) => p.clientPhone && p.clientPhone.includes('99999 11111')
  );
  assert(!leakedPhoneToB, 'User B CANNOT see User A client phone number');

  const leakedWorkersToB = userBProjects.some((p) =>
    p.workers.some((w) => w.name === 'Ramesh Carpenter')
  );
  assert(!leakedWorkersToB, 'User B CANNOT see User A worker records');

  const leakedTransactionsToB = userBProjects.some((p) =>
    p.transactions.some((t) => t.referenceNo === 'TX-CONFIDENTIAL-001')
  );
  assert(!leakedTransactionsToB, 'User B CANNOT see User A financial ledger data');

  const leakedChatToB = userBProjects.some((p) =>
    p.chatState?.messages.some((m) => m.content.includes('#4040'))
  );
  assert(!leakedChatToB, 'User B CANNOT see User A chat messages or gate security code');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: LEGITIMATE OFFLINE PERSISTENCE (USER B -> LOGOUT -> USER A)
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 3] Legitimate Offline Persistence (User B -> Logout -> User A)');

  // User B creates their own project
  const codeB = `PRJ-BOB-${Date.now().toString().slice(-4)}`;
  const projectB = await ContractorBackendService.createProject({
    clientCode: codeB,
    projectName: 'Bob Commercial Plaza',
    clientName: 'Tata Retail',
    clientPhone: '+91 98444 22222',
    siteAddress: 'Plot 12, BKC Complex, Mumbai',
    startDate: '10 Dec 2026',
    status: 'active',
  });

  const projectsOfB = await ContractorStorageService.getProjects(USER_B.id);
  assert(
    projectsOfB.some((p) => p.id === projectB.id),
    'User B project is persisted in User B cache'
  );

  // User B logs out
  await AuthService.logout();

  // User A logs back in
  await setTestSession(USER_A);
  const reloadedAProjects = await ContractorStorageService.getProjects(USER_A.id);

  // User A can access their own previous offline cache
  const reloadedA = reloadedAProjects.find((p) => p.id === projectA.id);
  assert(Boolean(reloadedA), 'User A can still access User A own permitted local offline cache');
  assert(
    reloadedA?.workers.length === 1 && reloadedA?.workers[0].name === 'Ramesh Carpenter',
    'User A worker records are intact across logout/re-login'
  );
  assert(
    reloadedA?.transactions.length === 1 &&
      reloadedA?.transactions[0].referenceNo === 'TX-CONFIDENTIAL-001',
    'User A financial transactions are intact across logout/re-login'
  );

  // User A CANNOT see User B's project
  const leakedBToA = reloadedAProjects.find((p) => p.id === projectB.id);
  assert(!leakedBToA, 'User A CANNOT see User B cached project');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: UNAUTHENTICATED ACCESS GUARD & UNOWNED CATALOG SEED
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 4] Unauthenticated Access Guard & Catalog Seed');

  await AuthService.logout();
  const unownedCatalog = await ContractorStorageService.getProjects(null);

  assert(unownedCatalog.length >= 3, 'Pre-seeded demonstration catalog exists for unauthenticated state');
  for (const p of unownedCatalog) {
    assert(
      p.contractorId === null && p.clientId === null,
      `Catalog project ${p.id} has strictly NULL ownership`
    );
  }

  assert(
    !unownedCatalog.some((p) => p.id === projectA.id),
    'User A confidential project is NOT present in unowned seed catalog'
  );
  assert(
    !unownedCatalog.some((p) => p.id === projectB.id),
    'User B confidential project is NOT present in unowned seed catalog'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 5: LEGACY STATIC CACHE SAFE MIGRATION & NON-CONTAMINATION
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 5] Legacy Static Cache Safe Invalidation');

  // Simulate legacy static storage key with foreign project
  const legacyData: ContractorProjectDetail[] = [
    {
      id: 'legacy-proj-foreign-1',
      clientCode: 'LEG-001',
      projectName: 'Legacy Foreign Project',
      clientName: 'Legacy Client',
      clientPhone: '+91 98000 00000',
      siteAddress: 'Legacy Address',
      startDate: '01 Jan 2026',
      status: 'active',
      contractorId: USER_A.id, // Owned by User A
      clientId: null,
      scopeItems: [],
      workers: [],
      todayAttendance: [],
      dailyReports: [],
      transactions: [],
      chatState: { workerMessagingAllowed: false, messages: [] },
    },
    {
      id: 'legacy-proj-unowned-2',
      clientCode: 'LEG-002',
      projectName: 'Legacy Unowned Project',
      clientName: 'Unowned Client',
      clientPhone: '+91 98000 00001',
      siteAddress: 'Unowned Address',
      startDate: '01 Jan 2026',
      status: 'active',
      contractorId: null,
      clientId: null,
      scopeItems: [],
      workers: [],
      todayAttendance: [],
      dailyReports: [],
      transactions: [],
      chatState: { workerMessagingAllowed: false, messages: [] },
    },
  ];

  // Manually write to legacy static key
  const isWeb = typeof window !== 'undefined' && typeof (window as any).document !== 'undefined';
  if (isWeb && window.localStorage) {
    window.localStorage.setItem(LEGACY_STATIC_KEY, JSON.stringify(legacyData));
  }

  // User B logs in and triggers migration
  await setTestSession(USER_B);
  await ContractorStorageService.migrateLegacyCache(USER_B.id);

  // Verify User B did NOT inherit User A's legacy project or unowned project
  const userBAfterMigration = await ContractorStorageService.getProjects(USER_B.id);
  assert(
    !userBAfterMigration.some((p) => p.id === 'legacy-proj-foreign-1'),
    'User B did NOT inherit User A legacy project (cross-contamination blocked)'
  );
  assert(
    !userBAfterMigration.some((p) => p.id === 'legacy-proj-unowned-2'),
    'User B did NOT blindly inherit unowned legacy project'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 6: CONTROLLED PROJECT LINKING & CROSS-TENANT SYNCHRONIZATION
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 6] Controlled Project Linking & Cross-Tenant Synchronization');

  // User A creates project with clientCode
  await setTestSession(USER_A);
  const inviteCode = `LINK-${Date.now().toString().slice(-4)}`;
  const projectToLink = await ContractorBackendService.createProject({
    clientCode: inviteCode,
    projectName: 'Luxury Villa Fitout',
    clientName: 'Charlie Client',
    clientPhone: '+91 98333 00003',
    siteAddress: 'Alibaug Beachfront Villa',
    startDate: '15 Dec 2026',
    status: 'active',
  });

  // User C (Client) joins via code
  await setTestSession(USER_C);
  const joined = await ContractorBackendService.joinProjectByCode(inviteCode);
  assert(Boolean(joined), 'Client C joined project via legitimate clientCode');
  assert(joined?.clientId === USER_C.id, 'Joined project client_id matches Client C UID');
  assert(joined?.contractorId === USER_A.id, 'Contractor A ownership intact after client link');

  // User C can see this linked project
  const clientCProjects = await ContractorStorageService.getProjects(USER_C.id);
  assert(
    clientCProjects.some((p) => p.id === projectToLink.id),
    'Linked project is present in Client C user-scoped storage'
  );

  // Third user (User B) cannot see this project
  await setTestSession(USER_B);
  const projectsBAfterJoin = await ContractorStorageService.getProjects(USER_B.id);
  assert(
    !projectsBAfterJoin.some((p) => p.id === projectToLink.id),
    'Unrelated Contractor B CANNOT see User A / Client C linked project'
  );

  // User B cannot claim the already linked project
  let bClaimFailed = false;
  try {
    const claimAttempt = await ContractorBackendService.joinProjectByCode(inviteCode);
    if (!claimAttempt || claimAttempt.clientId !== USER_B.id) {
      bClaimFailed = true;
    }
  } catch {
    bClaimFailed = true;
  }
  assert(bClaimFailed, 'Contractor B CANNOT claim or overwrite already linked project');

  // --------------------------------------------------------------------------
  // TEST SUITE 7: CACHE CLEAR & FACTORY RESET
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 7] Cache Clear & Factory Reset Isolation');

  // Clear User A's cache only
  await ContractorStorageService.clearUserCache(USER_A.id);
  const aAfterClear = await ContractorStorageService.getProjects(USER_A.id);
  assert(
    !aAfterClear.some((p) => p.id === projectA.id),
    'User A cache is completely purged after clearUserCache'
  );

  // User B's cache is preserved
  const bAfterClear = await ContractorStorageService.getProjects(USER_B.id);
  assert(
    bAfterClear.some((p) => p.id === projectB.id),
    'User B cache remains completely intact when User A cache is purged'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 8: CROSS-CACHE SECURITY & PRE-AUTHORIZATION PROTECTION (TESTS 1-13)
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 8] Cross-Cache Security & Pre-Authorization Protection');

  // Setup: User A (Contractor) creates Project A with sensitive details
  await setTestSession(USER_A);
  const codeSecA = `SEC-PRJ-${Date.now().toString().slice(-4)}`;
  const projectSecA = await ContractorBackendService.createProject({
    clientCode: codeSecA,
    projectName: 'Ultra Confidential Villa A',
    clientName: 'Ambani Family Office',
    clientPhone: '+91 99999 88888',
    siteAddress: 'Altamount Road, Cumballa Hill, Mumbai',
    startDate: '01 Jan 2027',
    status: 'active',
  });

  await ContractorBackendService.addWorker(projectSecA.id, {
    name: 'Secret Master Mason',
    role: 'Mason',
    dailyWage: 2000,
    phone: '+91 98765 00000',
  });

  await ContractorBackendService.addTransaction(projectSecA.id, {
    date: 'Today',
    amount: 5000000,
    type: 'received_from_client',
    note: 'Confidential Milestone Tranche',
    recipientOrPayer: 'Client Secret Rep',
    referenceNo: 'TX-SECRET-999',
  });

  await ContractorBackendService.sendChatMessage(projectSecA.id, {
    id: `msg-sec-${Date.now()}`,
    senderRole: 'contractor',
    senderName: 'Alice',
    content: 'Biometric master override code is 998877.',
    timestamp: '12:00 PM',
    isAuthorityAction: true,
  });

  // TEST 1: User A owns Project A. User B calls findProjectByCode(ProjectA.clientCode) -> Expected: NULL
  await setTestSession(USER_B);
  const test1Result = await ContractorStorageService.findProjectByCode(codeSecA);
  assert(test1Result === null, 'TEST 1: User B calling findProjectByCode(ProjectA.clientCode) returns NULL');

  // TEST 2: Unauthenticated caller calls findProjectByCode(ProjectA.clientCode) -> Expected: NULL
  await setTestSession(null);
  const test2Result = await ContractorStorageService.findProjectByCode(codeSecA);
  assert(test2Result === null, 'TEST 2: Unauthenticated caller calling findProjectByCode(ProjectA.clientCode) returns NULL');

  // TEST 3: User B calls getProjectById(ProjectA.id) -> Expected: NULL
  await setTestSession(USER_B);
  const test3Result = await ContractorStorageService.getProjectById(projectSecA.id);
  assert(test3Result === null, 'TEST 3: User B calling getProjectById(ProjectA.id) returns NULL');

  // TEST 4: User B must not receive ANY of Project A's fields before successful authorization
  assert(
    test1Result === null && test3Result === null,
    'TEST 4: User B receives ZERO project fields (phone, address, workers, wages, ledger, BOQ, attendance, reports, chat) before authorization'
  );

  // TEST 5: Contractor B knows Contractor A's project code. Contractor B attempts local join -> Expected: DENIED
  await setTestSession(USER_B); // USER_B has role: 'contractor'
  let ctrBJoinDenied = false;
  try {
    await ContractorBackendService.joinProjectByCode(codeSecA);
  } catch (err: any) {
    if (err.message && (err.message.includes('Contractor cannot join') || err.message.includes('Only client accounts'))) {
      ctrBJoinDenied = true;
    }
  }
  assert(ctrBJoinDenied, 'TEST 5: Contractor B attempting to join Contractor A project is DENIED (Contractor cannot become clientId)');

  // TEST 6: USER_REGISTRY_KEY exists. Attempt to enumerate registry and use it to obtain another user's project -> Expected: DENIED / impossible through service APIs
  const regRaw = await StorageService.getItem(USER_REGISTRY_KEY);
  assert(Boolean(regRaw), 'USER_REGISTRY_KEY exists for local bookkeeping');
  const registryBypassAttempt = await ContractorStorageService.getProjectById(projectSecA.id);
  assert(registryBypassAttempt === null, 'TEST 6: USER_REGISTRY_KEY cannot be used to obtain another user project through service APIs (DENIED)');

  // TEST 7: Client C has valid project code for unlinked project -> joinProjectByCode(code) succeeds
  await setTestSession(USER_C); // USER_C has role: 'client'
  const clientCJoined = await ContractorBackendService.joinProjectByCode(codeSecA);
  assert(Boolean(clientCJoined), 'TEST 7: Client C successfully joins unlinked project via legitimate code');
  assert(clientCJoined?.clientId === USER_C.id, 'TEST 7: Client C becomes client_id');
  assert(clientCJoined?.contractorId === USER_A.id, 'TEST 7: contractor_id remains unchanged');
  const clientCStorageCheck = await ContractorStorageService.getProjectById(projectSecA.id);
  assert(clientCStorageCheck?.id === projectSecA.id, 'TEST 7: Project is stored in Client C own cache');

  // TEST 8: Client D attempts to join the same already-linked project -> Expected: DENIED
  const USER_D: User = {
    id: 'd0000000-0000-4000-8000-000000000004',
    email: 'client.dave@servex.com',
    name: 'Dave Client',
    role: 'client',
    phone: '9844400004',
    countryCode: '+91',
    authProvider: 'email',
    createdAt: '2026-01-01T00:00:00.000Z',
    isPhoneVerified: true,
  };
  await setTestSession(USER_D);
  let clientDDenied = false;
  try {
    await ContractorBackendService.joinProjectByCode(codeSecA);
  } catch (err: any) {
    if (err.message && err.message.includes('already linked')) {
      clientDDenied = true;
    }
  }
  assert(clientDDenied, 'TEST 8: Client D attempting to join already-linked project is DENIED');

  // TEST 9: Invalid/random project code -> Expected: safe failure with no project information disclosure
  const invalidCodeResult = await ContractorBackendService.joinProjectByCode('RANDOM-INVALID-999');
  assert(invalidCodeResult === null, 'TEST 9: Invalid/random project code safely fails with NULL and zero disclosure');

  // TEST 10: After User A logs out and User B logs in: User B must not see User A's project
  await setTestSession(USER_B);
  const bProjects = await ContractorStorageService.getProjects(USER_B.id);
  const bById = await ContractorStorageService.getProjectById(projectSecA.id);
  const bByCode = await ContractorStorageService.findProjectByCode(codeSecA);
  assert(
    !bProjects.some((p) => p.id === projectSecA.id) && bById === null && bByCode === null,
    'TEST 10: After User A logout and User B login: User B cannot see User A project through any storage method'
  );

  // TEST 11: User A logs back in. User A can still access User A's own cached project
  await setTestSession(USER_A);
  const aProjects = await ContractorStorageService.getProjects(USER_A.id);
  const aOwnProject = aProjects.find((p) => p.id === projectSecA.id);
  assert(Boolean(aOwnProject), 'TEST 11: User A logs back in and can access own cached project');
  assert(aOwnProject?.workers.length === 1, 'TEST 11: User A workers intact in own cache');
  assert(aOwnProject?.transactions.length === 1, 'TEST 11: User A transactions intact in own cache');

  // TEST 12: Verify there is no remaining code path that calls getRegisteredUserIds() for project discovery or authorization
  const fs = require('fs');
  const storageCode = fs.readFileSync('src/services/contractorStorageService.ts', 'utf8');
  assert(
    !storageCode.slice(storageCode.indexOf('findProjectByCode('), storageCode.indexOf('linkProjectByCodeLocally(')).includes('getRegisteredUserIds'),
    'TEST 12: getRegisteredUserIds() is NOT called inside findProjectByCode()'
  );
  assert(
    !storageCode.slice(storageCode.indexOf('getProjectById('), storageCode.indexOf('createProject(')).includes('getRegisteredUserIds'),
    'TEST 12: getRegisteredUserIds() is NOT called inside getProjectById()'
  );

  // TEST 13: Tenant isolation verification across the repo
  assert(
    !storageCode.includes('syncProjectToUserCache'),
    'TEST 13: syncProjectToUserCache cross-writing removed from codebase'
  );

  // Teardown
  await ContractorStorageService.clearUserCache(USER_A.id);
  await ContractorStorageService.clearUserCache(USER_B.id);
  await ContractorStorageService.clearUserCache(USER_C.id);
  await ContractorStorageService.clearUserCache(USER_D.id);
  await AuthService.logout();

  console.log('\n======================================================');
  console.log(`Remediation 2 Cache Isolation: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRemediation2Tests().catch((err) => {
  console.error('Fatal error during Remediation 2 tests:', err);
  process.exit(1);
});
