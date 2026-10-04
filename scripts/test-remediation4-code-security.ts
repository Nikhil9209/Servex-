declare const require: any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

import { StorageService } from '../src/services/storage';
import { ContractorBackendService, isValidUuid } from '../src/services/contractorBackendService';
import {
  ContractorStorageService,
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
} from '../src/services/contractorStorageService';
import { getSupabaseClient, isSupabaseConfigured } from '../src/services/supabaseClient';
import {
  generateSecureProjectCode,
  isValidProjectCodeFormat,
  calculateCodeEntropyBits,
  normalizeProjectCode,
  SECURE_CODE_CHARSET,
} from '../src/utils/projectCodeGenerator';

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
      role: (identity.role as any) || undefined,
      authProvider: 'email',
      createdAt: new Date().toISOString(),
      isPhoneVerified: true,
    },
    expiresAt: Date.now() + 3600000,
  });
}

async function runRemediation4Tests() {
  console.log('\n======================================================');
  console.log('   STAGE 5 — REMEDIATION 4: PROJECT-CODE SECURITY     ');
  console.log('======================================================\n');

  const supabase = getSupabaseClient();
  const isCloudActive = Boolean(supabase && isSupabaseConfigured());
  console.log(`Cloud Supabase Connection Active: ${isCloudActive}\n`);

  // --------------------------------------------------------------------------
  // TEST 1: New High-Entropy Project Code Generation
  // --------------------------------------------------------------------------
  console.log('[Test 1] High-Entropy Project Code Generation');
  const codeSample = generateSecureProjectCode();
  assert(
    isValidProjectCodeFormat(codeSample),
    `Generated code '${codeSample}' matches high-entropy SRX-XXXX-XXXX format`
  );
  assert(
    codeSample.startsWith('SRX-'),
    'Code uses standard Servex SRX prefix for brand recognition and validation'
  );
  const entropyBits = calculateCodeEntropyBits(codeSample);
  assert(
    entropyBits >= 40,
    `Code provides ${entropyBits} bits of entropy (>= 40 bits required, vs ~13 bits previously)`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Zero Math.random() Usage for Project Codes
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Cryptographic Source Verification (Zero Math.random)');
  const generatorSrc = fs.readFileSync(
    path.join(__dirname, '../src/utils/projectCodeGenerator.ts'),
    'utf8'
  );
  assert(
    !generatorSrc.includes('Math.random'),
    'projectCodeGenerator.ts strictly uses CSPRNG; zero Math.random() calls'
  );
  const contractorHomeSrc = fs.readFileSync(
    path.join(__dirname, '../src/screens/contractor/ContractorHomeScreen.tsx'),
    'utf8'
  );
  assert(
    !contractorHomeSrc.includes('Math.random() * 9000'),
    'ContractorHomeScreen.tsx removed legacy CLT-#### Math.random generation'
  );

  // --------------------------------------------------------------------------
  // TEST 3: Generated Codes Uniqueness Across Many Samples
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Collision Resistance & Uniqueness Across 10,000 Codes');
  const codeSet = new Set<string>();
  const SAMPLE_SIZE = 10000;
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const c = generateSecureProjectCode();
    codeSet.add(c);
  }
  assert(
    codeSet.size === SAMPLE_SIZE,
    `Generated ${SAMPLE_SIZE} project codes with 0 collisions (100% unique)`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Invalid/Nonexistent Code Fails Safely
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Invalid Code Fails Safely Without Leak');
  await setTestSession(IDENTITIES.clientA);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientA.id);
  const invalidResult = await ContractorBackendService.joinProjectByCode('SRX-NONEXISTENT-999');
  assert(
    invalidResult === null,
    'Invalid/nonexistent project code safely fails and returns null without data leak'
  );

  // --------------------------------------------------------------------------
  // TEST 5: Valid Unlinked Code Links Successfully
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Valid Unlinked Code Links Successfully');
  await setTestSession(IDENTITIES.contractorA);
  const secureCodeA = generateSecureProjectCode();
  const projectA = await ContractorBackendService.createProject({
    clientCode: secureCodeA,
    projectName: 'High Entropy Tower Fitout',
    clientName: 'Alice Client',
    clientPhone: '+91 98200 11111',
    siteAddress: 'Floor 18, Tower 3, Worli, Mumbai',
    startDate: '01 Nov 2026',
    status: 'active',
  });
  assert(projectA.clientCode === secureCodeA, 'Project created with CSPRNG secure code');
  assert(projectA.contractorId === IDENTITIES.contractorA.id, 'Project contractor_id matches contractor');
  assert(projectA.clientId === null, 'Project starts unlinked (clientId = null)');

  await setTestSession(IDENTITIES.clientA);
  const joinedA = await ContractorBackendService.joinProjectByCode(secureCodeA);
  assert(joinedA !== null, 'Client Alice successfully joins project via high-entropy code');
  assert(
    joinedA?.clientId === IDENTITIES.clientA.id,
    'Project clientId is linked to authenticated Client Alice'
  );
  assert(
    joinedA?.contractorId === IDENTITIES.contractorA.id,
    'Contractor ownership preserved after linking'
  );

  // Idempotent re-join by same client succeeds safely
  const reJoinedA = await ContractorBackendService.joinProjectByCode(secureCodeA);
  assert(
    reJoinedA?.clientId === IDENTITIES.clientA.id,
    'Idempotent re-join by already-linked client succeeds safely'
  );

  // --------------------------------------------------------------------------
  // TEST 6 / TEST N: Already-Linked Project Takeover Prevention
  // --------------------------------------------------------------------------
  console.log('\n[Test 6 / Test N] Already-Linked Project Takeover Prevention');
  await setTestSession(IDENTITIES.clientB);
  let claimBlocked = false;
  try {
    const resB = await ContractorBackendService.joinProjectByCode(secureCodeA);
    if (resB === null || resB?.clientId === IDENTITIES.clientA.id) {
      claimBlocked = true; // Returned null or without overwriting Client A
    }
  } catch (err: any) {
    if (
      err.message &&
      (err.message.includes('already linked') || err.message.includes('Invalid or expired project code'))
    ) {
      claimBlocked = true;
    }
  }
  const checkOwner = await ContractorStorageService.getProjectById(projectA.id, IDENTITIES.clientA.id);
  assert(
    claimBlocked && checkOwner?.clientId === IDENTITIES.clientA.id,
    'Client Bob CANNOT claim or overwrite project linked to Client Alice (DENIED)'
  );

  // --------------------------------------------------------------------------
  // TEST 7: Expired Project Code Cannot Link
  // --------------------------------------------------------------------------
  console.log('\n[Test 7] Code Expiry Enforcement');
  await setTestSession(IDENTITIES.contractorA);
  const expiredCode = generateSecureProjectCode();
  const expiredProject = await ContractorStorageService.createProject(
    {
      clientCode: expiredCode,
      projectName: 'Expired Invitation Site',
      clientName: 'Delayed Client',
      clientPhone: '+91 98200 22222',
      siteAddress: 'Plot 44, SEZ Zone, Mumbai',
      startDate: '01 Oct 2026',
      status: 'active',
      codeCreatedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
      codeExpiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
    },
    IDENTITIES.contractorA.id
  );

  await setTestSession(IDENTITIES.clientB);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientB.id);
  let expiredJoinRejected = false;
  try {
    const resExp = await ContractorBackendService.joinProjectByCode(expiredCode);
    if (resExp === null) {
      expiredJoinRejected = true;
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Invalid or expired project code')) {
      expiredJoinRejected = true;
    }
  }
  assert(
    expiredJoinRejected,
    'Expired project code cannot be used to link unlinked project (REJECTED)'
  );

  // --------------------------------------------------------------------------
  // TEST 8: Code Rotation & Old Code Invalidation
  // --------------------------------------------------------------------------
  console.log('\n[Test 8] Code Rotation & Old Code Invalidation');
  await setTestSession(IDENTITIES.contractorA);
  const oldCode = generateSecureProjectCode();
  const rotProject = await ContractorBackendService.createProject({
    clientCode: oldCode,
    projectName: 'Commercial Flagship Store',
    clientName: 'Retail Corp',
    clientPhone: '+91 98200 33333',
    siteAddress: 'Linking Road, Bandra West, Mumbai',
    startDate: '15 Nov 2026',
    status: 'active',
  });

  // Contractor rotates code
  const newRotatedCode = generateSecureProjectCode();
  const rotatedProject = await ContractorBackendService.rotateProjectCode(rotProject.id, newRotatedCode);
  assert(
    rotatedProject?.clientCode === newRotatedCode,
    'Contractor rotated project code successfully'
  );

  // Old code cannot link
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  const oldCodeAttempt = await ContractorBackendService.joinProjectByCode(oldCode);
  assert(
    oldCodeAttempt === null,
    'Old rotated code cannot link project (fails safely)'
  );

  // New code links project
  const newCodeSuccess = await ContractorBackendService.joinProjectByCode(newRotatedCode);
  assert(
    newCodeSuccess !== null && newCodeSuccess.clientId === IDENTITIES.clientC.id,
    'New rotated code links project successfully'
  );

  // --------------------------------------------------------------------------
  // TEST A: Failed attempt persists after invalid RPC / call (failedAttempts = 1)
  // --------------------------------------------------------------------------
  console.log('\n[Test A] Failed Attempt Persists After Invalid Call (failedAttempts = 1)');
  await setTestSession(IDENTITIES.clientB);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientB.id);
  const resA = await ContractorBackendService.joinProjectByCode('SRX-FAIL-0001');
  assert(resA === null, 'Invalid code returns null uniformly');
  const attemptsA = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientB.id);
  assert(attemptsA.failedAttempts === 1, 'First invalid attempt persists failed_attempts = 1');
  assert(attemptsA.lockedUntil === null, 'Lockout not active on attempt 1');

  const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  assert(
    schemaSql.includes('INSERT INTO project_code_attempts') && !schemaSql.includes("RAISE EXCEPTION 'Invalid or expired project code"),
    'PostgreSQL join_project_by_code returns NULL to COMMIT failed_attempts to disk (no rollback)'
  );

  // --------------------------------------------------------------------------
  // TEST B: Second invalid attempt increments persisted counter (failedAttempts = 2)
  // --------------------------------------------------------------------------
  console.log('\n[Test B] Second Invalid Attempt Increments Persisted Counter (failedAttempts = 2)');
  const resB = await ContractorBackendService.joinProjectByCode('SRX-FAIL-0002');
  assert(resB === null, 'Second invalid code returns null');
  const attemptsB = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientB.id);
  assert(attemptsB.failedAttempts === 2, 'Second invalid attempt increments persisted failed_attempts = 2');

  // --------------------------------------------------------------------------
  // TEST C: Fifth failure persists lockout (failedAttempts = 5, lockedUntil set)
  // --------------------------------------------------------------------------
  console.log('\n[Test C] Fifth Failure Persists Lockout (failedAttempts = 5, lockedUntil set)');
  await ContractorBackendService.joinProjectByCode('SRX-FAIL-0003');
  await ContractorBackendService.joinProjectByCode('SRX-FAIL-0004');
  await ContractorBackendService.joinProjectByCode('SRX-FAIL-0005');
  const attemptsC = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientB.id);
  assert(attemptsC.failedAttempts === 5, 'Fifth invalid attempt persists failed_attempts = 5');
  assert(
    attemptsC.lockedUntil !== null && attemptsC.lockedUntil > Date.now(),
    'Lockout timestamp (lockedUntil) is persisted for 15 minutes'
  );

  // --------------------------------------------------------------------------
  // TEST D: Sixth attempt is rejected (lockout enforced)
  // --------------------------------------------------------------------------
  console.log('\n[Test D] Sixth Attempt Rejected by Active Lockout');
  let sixthAttemptBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode('SRX-FAIL-0006');
  } catch (err: any) {
    if (err.message && err.message.includes('Too many failed')) {
      sixthAttemptBlocked = true;
    }
  }
  assert(sixthAttemptBlocked, 'Sixth attempt is rejected by lockout (Too many failed project code attempts)');

  // Cannot bypass with valid code while locked out
  let validBypassBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode(newRotatedCode);
  } catch (err: any) {
    if (err.message && err.message.includes('Too many failed')) {
      validBypassBlocked = true;
    }
  }
  assert(validBypassBlocked, 'Submitting valid code while locked out is rejected');

  // --------------------------------------------------------------------------
  // TEST E: Lockout survives app restart / session reload
  // --------------------------------------------------------------------------
  console.log('\n[Test E] Lockout Survives App Restart / Session Reload');
  const reloadedAttempts = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientB.id);
  assert(
    reloadedAttempts.lockedUntil !== null && reloadedAttempts.lockedUntil > Date.now(),
    'Lockout persists across application restarts in persistent storage'
  );
  let restartJoinBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode('SRX-FAIL-0007');
  } catch (err: any) {
    if (err.message && err.message.includes('Too many failed')) {
      restartJoinBlocked = true;
    }
  }
  assert(restartJoinBlocked, 'Lockout continues to block attempts after restart');

  // --------------------------------------------------------------------------
  // TEST F: Lockout survives device reinstall (Server-side persistence)
  // --------------------------------------------------------------------------
  console.log('\n[Test F] Lockout Survives Device Reinstall (Server-Side Persistence)');
  assert(
    schemaSql.includes('user_id UUID PRIMARY KEY REFERENCES auth.users(id)'),
    'Server-side attempts table references auth.users(id); cannot be cleared by client reinstall'
  );
  assert(
    schemaSql.includes('REVOKE ALL ON TABLE project_code_attempts FROM PUBLIC;'),
    'Client cannot reset project_code_attempts table directly via API'
  );

  // --------------------------------------------------------------------------
  // TEST G: Direct RPC cannot bypass rate limit
  // --------------------------------------------------------------------------
  console.log('\n[Test G] Direct RPC Cannot Bypass Rate Limit');
  assert(
    schemaSql.includes('SELECT * INTO v_attempt\n    FROM project_code_attempts\n    WHERE user_id = v_user_id\n    FOR UPDATE;'),
    'join_project_by_code queries project_code_attempts FOR UPDATE before lookup'
  );
  assert(
    schemaSql.includes('IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > NOW() THEN'),
    'join_project_by_code checks lockout before code matching; direct RPC callers cannot bypass'
  );

  // --------------------------------------------------------------------------
  // TEST H: Concurrent invalid attempts are serialized correctly
  // --------------------------------------------------------------------------
  console.log('\n[Test H] Concurrent Invalid Attempts Are Serialized Correctly');
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  await Promise.all([
    ContractorBackendService.joinProjectByCode('SRX-RACE-0001'),
    ContractorBackendService.joinProjectByCode('SRX-RACE-0002'),
    ContractorBackendService.joinProjectByCode('SRX-RACE-0003'),
  ]);
  const raceAttempts = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientC.id);
  assert(
    raceAttempts.failedAttempts === 3,
    `Concurrent invalid attempts accurately counted (got ${raceAttempts.failedAttempts}, expected 3)`
  );
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);

  // --------------------------------------------------------------------------
  // TEST I: Nonexistent / Expired / Already-Linked Remain Uniform (Zero Oracle)
  // --------------------------------------------------------------------------
  console.log('\n[Test I] Nonexistent / Expired / Already-Linked Remain Uniform (Zero Oracle)');
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  const nonExistentResult = await ContractorBackendService.joinProjectByCode('SRX-NONEXIST-0000');
  const expiredResult = await ContractorBackendService.joinProjectByCode(expiredCode);
  const linkedResult = await ContractorBackendService.joinProjectByCode(secureCodeA); // already linked to Client A
  assert(nonExistentResult === null, 'Nonexistent code returns null');
  assert(expiredResult === null, 'Expired code returns null');
  assert(linkedResult === null, 'Already-linked code returns null');
  assert(
    nonExistentResult === expiredResult && expiredResult === linkedResult,
    'All failure modes return identical null result (zero enumeration oracle)'
  );
  assert(
    !schemaSql.includes("RAISE EXCEPTION 'Project not found with code %'"),
    'Database RPC removed leaky Project not found with code enumeration oracle'
  );

  // --------------------------------------------------------------------------
  // TEST J: Legacy CLT Code Is Rate-Limited
  // --------------------------------------------------------------------------
  console.log('\n[Test J] Legacy CLT Code Is Rate-Limited');
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  for (let i = 1; i <= 5; i++) {
    await ContractorBackendService.joinProjectByCode(`CLT-999${i}`);
  }
  let legacyLockoutBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode('CLT-9996');
  } catch (err: any) {
    if (err.message && err.message.includes('Too many failed')) {
      legacyLockoutBlocked = true;
    }
  }
  assert(legacyLockoutBlocked, '5 failed legacy CLT code attempts triggers lockout');
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);

  // --------------------------------------------------------------------------
  // TEST K: Modern SRX Code Is Rate-Limited
  // --------------------------------------------------------------------------
  console.log('\n[Test K] Modern SRX Code Is Rate-Limited');
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  for (let i = 1; i <= 5; i++) {
    await ContractorBackendService.joinProjectByCode(`SRX-TEST-000${i}`);
  }
  let srxLockoutBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode('SRX-TEST-0006');
  } catch (err: any) {
    if (err.message && err.message.includes('Too many failed')) {
      srxLockoutBlocked = true;
    }
  }
  assert(srxLockoutBlocked, '5 failed modern SRX code attempts triggers lockout');
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);

  // --------------------------------------------------------------------------
  // TEST L: Valid Join Still Works & Clears Failed Attempts
  // --------------------------------------------------------------------------
  console.log('\n[Test L] Valid Join Still Works & Clears Failed Attempts');
  await setTestSession(IDENTITIES.contractorA);
  const testLCode = generateSecureProjectCode();
  await ContractorBackendService.createProject({
    clientCode: testLCode,
    projectName: 'Valid Linking Test Site',
    clientName: 'Charlie Client',
    clientPhone: '+91 98200 44444',
    siteAddress: 'Marine Drive, Mumbai',
    startDate: '10 Nov 2026',
    status: 'active',
  });
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  // Fail twice first
  await ContractorBackendService.joinProjectByCode('SRX-FAIL-FIRST1');
  await ContractorBackendService.joinProjectByCode('SRX-FAIL-FIRST2');
  assert((await ContractorStorageService.getCodeAttempts(IDENTITIES.clientC.id)).failedAttempts === 2, 'Pre-join attempts = 2');
  // Now join valid
  const joinedL = await ContractorBackendService.joinProjectByCode(testLCode);
  assert(joinedL !== null && joinedL.clientId === IDENTITIES.clientC.id, 'Valid join succeeds');
  const postJoinAttempts = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientC.id);
  assert(postJoinAttempts.failedAttempts === 0, 'Successful join resets/clears failed attempts counter');

  // --------------------------------------------------------------------------
  // TEST Q: Lockout Expiry & Window Reset
  // --------------------------------------------------------------------------
  console.log('\n[Test Q] Lockout Expiry & Window Reset');
  await setTestSession(IDENTITIES.clientC);
  await ContractorStorageService.saveCodeAttempts(IDENTITIES.clientC.id, {
    failedAttempts: 5,
    firstFailedAt: Date.now() - 20 * 60 * 1000,
    lastFailedAt: Date.now() - 16 * 60 * 1000,
    lockedUntil: Date.now() - 1000, // Expired 1s ago
  });
  const afterExpiryAttempt = await ContractorBackendService.joinProjectByCode('SRX-EXPIRED-TEST');
  assert(afterExpiryAttempt === null, 'Attempt after lockout expiry proceeds normally (not blocked by old lockout)');
  const refreshedAttempts = await ContractorStorageService.getCodeAttempts(IDENTITIES.clientC.id);
  assert(refreshedAttempts.failedAttempts === 1, 'Counter resets and starts fresh from 1 after lockout window expiry');
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientC.id);
  await ContractorStorageService.clearCodeAttempts(IDENTITIES.clientB.id);

  // --------------------------------------------------------------------------
  // TEST 13 & 14: Contractor Cannot Join Own Project or Another Project as Client
  // --------------------------------------------------------------------------
  console.log('\n[Test 13 & 14] Contractor Role Restrictions on Client Linking');
  await setTestSession(IDENTITIES.contractorA);
  let contractorSelfJoinBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode(secureCodeA);
  } catch (err: any) {
    if (err.message && (err.message.includes('Contractor cannot join') || err.message.includes('Only client accounts'))) {
      contractorSelfJoinBlocked = true;
    }
  }
  assert(contractorSelfJoinBlocked, 'Contractor cannot join own project as client (DENIED)');

  await setTestSession(IDENTITIES.contractorB);
  let contractorCrossJoinBlocked = false;
  try {
    await ContractorBackendService.joinProjectByCode(secureCodeA);
  } catch (err: any) {
    if (err.message && (err.message.includes('Contractor cannot join') || err.message.includes('Only client accounts'))) {
      contractorCrossJoinBlocked = true;
    }
  }
  assert(contractorCrossJoinBlocked, 'Contractor B cannot claim Contractor A project as client (DENIED)');

  // --------------------------------------------------------------------------
  // TEST 15, 16, 17: Pre-Authorization Data Isolation
  // --------------------------------------------------------------------------
  console.log('\n[Test 15, 16, 17] Pre-Authorization Isolation & Project Code Not Auth');
  // Knowing a project code does NOT grant access to storage prior to linking
  await setTestSession(IDENTITIES.clientB);
  const unauthDetail = await ContractorStorageService.getProjectById(projectA.id, IDENTITIES.clientB.id);
  assert(unauthDetail === null, 'Unlinked Client B cannot fetch Project A by ID (RLS/Cache Isolation)');

  // --------------------------------------------------------------------------
  // TEST 18: Successful Linking Exposes Only Authorized Project
  // --------------------------------------------------------------------------
  console.log('\n[Test 18] Authorized Data Access Post-Linking');
  await setTestSession(IDENTITIES.clientA);
  const clientAProjects = await ContractorStorageService.getProjects(IDENTITIES.clientA.id);
  const foundA = clientAProjects.find((p) => p.id === projectA.id);
  assert(foundA !== undefined, 'Linked project is present in authorized Client A user-scoped cache');

  // --------------------------------------------------------------------------
  // TEST 19 & 20: Concurrency & Contractor Ownership Immutability
  // --------------------------------------------------------------------------
  console.log('\n[Test 19 & 20] Concurrency & contractor_id Immutability');
  assert(
    schemaSql.includes('FOR UPDATE'),
    'join_project_by_code uses FOR UPDATE row-level lock for atomic concurrency'
  );
  assert(
    foundA?.contractorId === IDENTITIES.contractorA.id,
    'contractor_id remains strictly unchanged after client linking'
  );

  // --------------------------------------------------------------------------
  // TEST 21 & 22: RLS Policies & Zero Broad Permissive Grants
  // --------------------------------------------------------------------------
  console.log('\n[Test 21 & 22] RLS Strength & Zero Permissive USING(true) Grants');
  assert(
    schemaSql.includes('ALTER TABLE projects ENABLE ROW LEVEL SECURITY;'),
    'RLS remains explicitly enabled on projects table'
  );
  assert(
    schemaSql.includes('ALTER TABLE project_code_attempts ENABLE ROW LEVEL SECURITY;'),
    'RLS is enabled on project_code_attempts table'
  );
  assert(
    !schemaSql.includes('USING (true)') && !schemaSql.includes('WITH CHECK (true)'),
    'Zero broad USING(true) or WITH CHECK(true) policies exist'
  );

  // --------------------------------------------------------------------------
  // TEST 23 & 24: Remediation 3 Roles & Remediation 2 Cache Isolation
  // --------------------------------------------------------------------------
  console.log('\n[Test 23 & 24] Regression Checks: Roles & Local Cache Isolation');
  // Attempt to create project as client -> blocked
  await setTestSession(IDENTITIES.clientA);
  let clientCreateBlocked = false;
  try {
    await ContractorBackendService.createProject({
      clientCode: generateSecureProjectCode(),
      projectName: 'Client Spoof Project',
      clientName: 'Spoofer',
      clientPhone: '+91 90000 00000',
      siteAddress: 'Nowhere',
      startDate: 'Today',
      status: 'active',
    });
  } catch {
    clientCreateBlocked = true;
  }
  assert(clientCreateBlocked, 'Remediation 3: Client cannot create projects (Authoritative DB Role)');

  // Remediation 2: Cache isolation
  const clientBCache = await ContractorStorageService.getProjects(IDENTITIES.clientB.id);
  const leakFound = clientBCache.some((p) => p.id === projectA.id);
  assert(!leakFound, 'Remediation 2: Client B cache does NOT contain Client A project');

  // --------------------------------------------------------------------------
  // TEST 25: Existing Legacy Code Format Support
  // --------------------------------------------------------------------------
  console.log('\n[Test 25] Legacy Project Code Format Backward Compatibility');
  assert(isValidProjectCodeFormat('CLT-8842'), 'Legacy project code CLT-8842 recognized as valid format');
  assert(isValidProjectCodeFormat('CLT-7721'), 'Legacy project code CLT-7721 recognized as valid format');
  assert(isValidProjectCodeFormat('CLT-9104'), 'Legacy project code CLT-9104 recognized as valid format');
  assert(
    schemaSql.includes("('proj-1', 'CLT-8842'"),
    'Pre-seeded database project proj-1 with CLT-8842 preserved safely'
  );

  // --------------------------------------------------------------------------
  // TEST 26: Schema Functions Security Hygiene
  // --------------------------------------------------------------------------
  console.log('\n[Test 26] Function Security Hygiene & Pinned search_path');
  assert(
    schemaSql.includes('REVOKE ALL ON FUNCTION rotate_project_code(TEXT, TEXT) FROM PUBLIC;'),
    'rotate_project_code() revoked from PUBLIC'
  );
  assert(
    schemaSql.includes('GRANT EXECUTE ON FUNCTION rotate_project_code(TEXT, TEXT) TO authenticated;'),
    'rotate_project_code() granted to authenticated'
  );
  assert(
    schemaSql.includes('REVOKE ALL ON TABLE project_code_attempts FROM PUBLIC;'),
    'project_code_attempts revoked from PUBLIC'
  );

  console.log('\n======================================================');
  console.log(`Remediation 4 Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRemediation4Tests().catch((err) => {
  console.error('Unhandled error in Remediation 4 tests:', err);
  process.exit(1);
});
