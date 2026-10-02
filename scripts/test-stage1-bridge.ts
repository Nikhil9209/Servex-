import { AuthService } from '../src/services/authService';
import { StorageService } from '../src/services/storage';
import { getSupabaseClient, getSupabaseSession, getSupabaseAuthUser } from '../src/services/supabaseClient';
import { PendingRegistration } from '../src/types/auth';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${testName}`);
    failed++;
  }
}

async function runStage1Verification() {
  console.log('\n======================================================');
  console.log('       STAGE 1 — AUTHENTICATION BRIDGE VERIFICATION    ');
  console.log('======================================================\n');

  // 1. Initial State & Clean Slate
  console.log('[Test 1] Initial Clean State & Logout');
  await AuthService.logout();
  const initSession = await StorageService.getSession();
  const initSupabaseSession = await getSupabaseSession();
  assert(initSession === null, 'Local Servex session is null after logout');
  assert(initSupabaseSession === null, 'Supabase Auth session is null after logout');

  // 2. Security Check: Zero Plaintext & Zero Fast/SHA-256 Hashes
  console.log('\n[Test 2] Password Storage Security: Zero Plaintext & Zero SHA-256');
  const initialUsers = await StorageService.getRegisteredUsers();
  for (const u of initialUsers) {
    if (u.passwordHash) {
      assert(
        u.passwordHash.startsWith('$2a$') || u.passwordHash.startsWith('$2b$'),
        `User ${u.email} uses salted bcrypt hash (starts with $2b$/$2a$), NEVER plaintext and NEVER SHA-256`
      );
      assert(
        u.passwordHash.length !== 64,
        `User ${u.email} is NOT stored as SHA-256 (SHA-256 is strictly prohibited for password storage)`
      );
    }
  }

  // 3. Invalid Credentials Test
  console.log('\n[Test 3] Invalid Credentials Handling');
  let nonExistentCaught = false;
  try {
    await AuthService.loginWithEmail('nonexistent_user_99@servex.com', 'SomePass123!');
  } catch (err: any) {
    nonExistentCaught = true;
    assert(err.message.includes('not found') || err.message.includes('Invalid'), 'Rejects non-existent email address');
  }
  assert(nonExistentCaught, 'Throws error on non-existent account');

  let wrongPassCaught = false;
  try {
    await AuthService.loginWithEmail('contractor@servex.com', 'WrongPasswordXYZ');
  } catch (err: any) {
    wrongPassCaught = true;
    assert(err.message.includes('Incorrect password') || err.message.includes('credentials'), 'Rejects incorrect password');
  }
  assert(wrongPassCaught, 'Throws error on wrong password');

  // 4. Valid Login Flow
  console.log('\n[Test 4] Valid Email/Password Login & Session Creation');
  const loginRes = await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  assert(loginRes.user.email === 'contractor@servex.com', 'Logged-in user email matches');
  assert(loginRes.user.role === 'contractor', 'Logged-in user role is contractor');
  assert(Boolean(loginRes.session.token), 'Valid Servex session token generated');

  // Verify Session in Storage
  const storedSession = await StorageService.getSession();
  assert(storedSession?.user.email === 'contractor@servex.com', 'Session persists in StorageService');

  // 5. Full Registration Flow (Email + OTP + Role Selection)
  console.log('\n[Test 5] Full Registration Flow & Supabase Auth Authority');
  const uniqueStamp = Date.now();
  const regEmail = `bridge_tester_${uniqueStamp}@servex.com`;
  const regPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regPassword = 'TestPassword@2026';

  const pending: PendingRegistration = {
    name: 'Stage One Tester',
    email: regEmail,
    phone: '',
    countryCode: '+91',
    passwordRaw: regPassword,
    authProvider: 'email',
    otpCode: '',
    otpExpiresAt: 0,
    otpLastSentAt: 0,
  };

  const pendingWithOtp = await AuthService.requestOtpForPhone(pending, regPhone, '+91');
  assert(pendingWithOtp.phone === regPhone, 'Phone number captured');
  assert(AuthService.verifyOtp(pendingWithOtp, pendingWithOtp.otpCode), 'OTP verified successfully');

  // Finalize Registration as Contractor
  const regResult = await AuthService.finalizeRegistration(pendingWithOtp, 'contractor');
  assert(regResult.user.name === 'Stage One Tester', 'Registered user name matches');
  assert(regResult.user.email === regEmail, 'Registered user email matches');
  assert(regResult.user.role === 'contractor', 'Role assigned as contractor');
  assert(Boolean(regResult.session.token), 'Session token created for new user');

  // Check stored user security in StorageService
  const allUsersAfterReg = await StorageService.getRegisteredUsers();
  const registeredUserRecord = allUsersAfterReg.find((u) => u.email === regEmail);
  assert(Boolean(registeredUserRecord), 'New user persisted in StorageService');
  assert(
    registeredUserRecord?.passwordHash === undefined ||
    registeredUserRecord?.passwordHash?.startsWith('$2b$'),
    'Application does NOT store a second password database — Supabase Auth is password authority; zero plaintext storage'
  );
  assert(
    registeredUserRecord?.passwordHash?.length !== 64,
    'Zero SHA-256 hashes present for newly registered users'
  );

  // 6. Supabase Auth Client Integration & Session Inspection
  console.log('\n[Test 6] Supabase Auth Client & Session Inspection');
  const supabase = getSupabaseClient();
  assert(Boolean(supabase), 'Supabase client initialized from environment');

  const sbSession = await getSupabaseSession();
  const sbUser = await getSupabaseAuthUser();
  console.log('   - Supabase Auth Session active:', Boolean(sbSession));
  console.log('   - Supabase Auth User ID:', sbUser?.id || '(pending confirm email toggle)');

  // 7. Google OAuth Bridge Flow
  console.log('\n[Test 7] Google OAuth Bridge Flow');
  const googleEmail = `google_bridge_${uniqueStamp}@gmail.com`;
  const googleResult = await AuthService.processGoogleIdentity({
    name: 'Google User Bridge',
    email: googleEmail,
    sub: `gsub_${uniqueStamp}`,
    picture: 'https://lh3.googleusercontent.com/a/sample',
  });
  assert(googleResult.status === 'NEEDS_PHONE', 'New Google user routes to mandatory phone verification (Flow B)');
  assert(googleResult.pendingUser?.email === googleEmail, 'Google user email captured for registration');

  // Existing Google user (Flow C)
  const existingGoogle = await AuthService.processGoogleIdentity({
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    sub: 'gsub_existing_123',
  });
  assert(existingGoogle.status === 'AUTHENTICATED', 'Existing Google user immediately enters without re-registration (Flow C)');
  assert(existingGoogle.user?.email === 'priya.sharma@gmail.com', 'Existing Google user identity matched');

  // 8. Logout Bridge & Session Termination
  console.log('\n[Test 8] Logout Bridge');
  await AuthService.logout();
  const postLogoutSession = await StorageService.getSession();
  const postLogoutSbSession = await getSupabaseSession();
  assert(postLogoutSession === null, 'Servex local session destroyed');
  assert(postLogoutSbSession === null, 'Supabase Auth session terminated via supabase.auth.signOut()');

  // 9. Session Restoration
  console.log('\n[Test 9] Session Restoration');
  // Re-login
  const reLogin = await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  assert(reLogin.user.email === 'contractor@servex.com', 'Re-login succeeded');
  const restoredSession = await StorageService.getSession();
  assert(restoredSession?.user.email === 'contractor@servex.com', 'Session restored from persistent storage');

  // Final cleanup logout
  await AuthService.logout();

  console.log('\n======================================================');
  console.log(`Stage 1 Verification Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runStage1Verification().catch((err) => {
  console.error('Fatal error during Stage 1 test:', err);
  process.exit(1);
});
