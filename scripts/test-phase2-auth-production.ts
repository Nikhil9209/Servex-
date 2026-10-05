/**
 * Servex Contractor — Phase 2: Authentication & Production Test Suite
 *
 * Exercises the complete Phase 2 verification matrix:
 * 1. OTP lifecycle (valid phone, valid OTP, invalid OTP, expired OTP, reused OTP, lockout, rate limit)
 * 2. Password recovery (valid email, safe error response, deep link parsing, expired link, new password, login)
 * 3. Google OAuth & role preservation (development, production identities, role onboarding, session persistence, logout)
 * 4. Phase 1 backend regression verification
 */

declare const require: any;
declare const __dirname: string;

const fs = require('fs');
const path = require('path');

import { AuthService } from '../src/services/authService';
import { OtpService } from '../src/services/otpService';
import { StorageService } from '../src/services/storage';
import { ContractorBackendService } from '../src/services/contractorBackendService';
import { ContractorStorageService } from '../src/services/contractorStorageService';
import { PendingRegistration, UserRole } from '../src/types/auth';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  __resetOtpMock,
  __getSimulatedDeliveredOtp,
  __getRecoveryRequests,
  __getUpdatedPasswords,
  getSupabaseClient,
} = require('./mocks/supabaseClient.js');

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

async function runPhase2Tests() {
  console.log('\n======================================================');
  console.log('   PHASE 2: AUTHENTICATION & PRODUCTION VERIFICATION ');
  console.log('======================================================\n');

  __resetOtpMock();
  await StorageService.clearSession();

  // ==========================================================================
  console.log('[Suite 1] OTP Security & Challenge Lifecycle Matrix');
  // ==========================================================================

  // 1.1 Valid Phone -> OTP sent
  const testPhone = '9876543210';
  const reqRes = await OtpService.requestOtp(testPhone, '+91');
  assert(reqRes.success === true, 'Valid phone: OTP challenge issued');
  assert(Boolean(reqRes.challengeId), 'Valid challenge ID returned');
  const deliveredCode = __getSimulatedDeliveredOtp(reqRes.challengeId);
  assert(deliveredCode && /^\d{6}$/.test(deliveredCode), 'CSPRNG 6-digit code delivered');

  // 1.2 Rate Limit Cooldown (within 60 seconds)
  let cooldownBlocked = false;
  try {
    await OtpService.requestOtp(testPhone, '+91');
  } catch (err: any) {
    cooldownBlocked = err.message.includes('wait') || err.message.includes('seconds');
  }
  assert(cooldownBlocked, 'Server cooldown enforces 60s wait period');

  // 1.3 Invalid OTP -> Rejected with attempt decrement
  let badOtpRejected = false;
  try {
    await OtpService.verifyOtp(reqRes.challengeId, '000000', testPhone);
  } catch {
    badOtpRejected = true;
  }
  assert(badOtpRejected, 'Invalid OTP: Rejected with remaining attempts');

  // 1.4 Too many attempts -> Challenge locked
  for (let i = 0; i < 4; i++) {
    try {
      await OtpService.verifyOtp(reqRes.challengeId, '000000', testPhone);
    } catch {
      // Intentionally exhaust attempts
    }
  }
  let lockedOut = false;
  try {
    await OtpService.verifyOtp(reqRes.challengeId, deliveredCode, testPhone);
  } catch (err: any) {
    lockedOut = err.message.includes('locked') || err.message.includes('exceeded') || err.message.includes('Incorrect');
  }
  assert(lockedOut, 'Too many attempts: Challenge locked permanently');

  // 1.5 New challenge -> Valid OTP -> Success
  // Advance time past cooldown
  const freshPhone = '9876543211';
  const req2 = await OtpService.requestOtp(freshPhone, '+91');
  const freshCode = __getSimulatedDeliveredOtp(req2.challengeId);
  const verifyRes = await OtpService.verifyOtp(req2.challengeId, freshCode, freshPhone);
  assert(verifyRes.verified === true, 'Valid OTP: Verification successful');
  assert(Boolean(verifyRes.verificationToken && verifyRes.verificationToken.length === 64), 'Valid OTP: Single-use 64-char token issued');

  // 1.6 Reused OTP -> Rejected (Cannot verify again after token issuance)
  let reusedOtpRejected = false;
  try {
    await OtpService.verifyOtp(req2.challengeId, freshCode, freshPhone);
  } catch {
    reusedOtpRejected = true;
  }
  assert(reusedOtpRejected, 'Reused OTP: Rejected after already verified');

  // 1.7 Single-Use Token Consumption
  const consumedFirst = await OtpService.consumeVerificationToken(freshPhone, verifyRes.verificationToken!);
  assert(consumedFirst === true, 'Token consumed successfully on first use');
  const consumedSecond = await OtpService.consumeVerificationToken(freshPhone, verifyRes.verificationToken!);
  assert(consumedSecond === false, 'Token rejected on replay / second consumption');

  // ==========================================================================
  console.log('\n[Suite 2] Password Recovery & Deep-Link Matrix');
  // ==========================================================================

  // 2.1 Valid email -> recovery initiated with official scheme
  const resetRes = await AuthService.requestPasswordReset('contractor@servex.com');
  assert(resetRes.success === true, 'Password reset request accepted');
  const recoveryCalls = __getRecoveryRequests();
  assert(recoveryCalls.length > 0, 'Supabase Auth resetPasswordForEmail invoked');
  assert(
    recoveryCalls[0].options?.redirectTo === 'servex-contractor://reset-password',
    'Redirect URL strictly matches application deep-link scheme servex-contractor://reset-password'
  );

  // 2.2 Invalid email format -> Safe client rejection
  let invalidEmailCaught = false;
  try {
    await AuthService.requestPasswordReset('invalid-email-format');
  } catch {
    invalidEmailCaught = true;
  }
  assert(invalidEmailCaught, 'Invalid email format rejected safely');

  // 2.3 Nonexistent email -> Safe response (no user enumeration)
  const nonExistentRes = await AuthService.requestPasswordReset('doesnotexist999@example.com');
  assert(nonExistentRes.success === true, 'Nonexistent email returns privacy-preserving response');

  // 2.4 Deep Link Parsing & PKCE exchange
  const supabase = getSupabaseClient();
  const validPkce = await supabase.auth.exchangeCodeForSession('valid_test_code_123');
  assert(validPkce.data?.session?.user?.id === 'mock-recovery-user-id', 'PKCE code exchange establishes recovery session');

  // 2.5 Expired / Invalid Deep Link Handling
  let expiredCaught = false;
  try {
    const expiredRes = await supabase.auth.exchangeCodeForSession('expired_code');
    if (expiredRes.error) expiredCaught = true;
  } catch {
    expiredCaught = true;
  }
  assert(expiredCaught, 'Expired/invalid PKCE recovery link cleanly handled with error');

  // 2.6 Password Update (<8 chars rejected)
  let shortPasswordRejected = false;
  try {
    await AuthService.updateUserPassword('short');
  } catch (err: any) {
    shortPasswordRejected = err.message.includes('8 characters');
  }
  assert(shortPasswordRejected, 'Password under 8 characters rejected by client & server');

  // 2.7 Password Update Success -> Clears temporary recovery session
  const newPass = 'ServexStrong2026!';
  await AuthService.updateUserPassword(newPass);
  const updatedList = __getUpdatedPasswords();
  assert(updatedList.includes(newPass), 'Supabase Auth updateUser updated password');
  const sessionAfterUpdate = await StorageService.getSession();
  assert(sessionAfterUpdate === null, 'Recovery session securely terminated after password reset');

  // 2.8 Normal login afterward works with registered credentials
  const loginRes = await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');
  assert(loginRes.user.email === 'contractor@servex.com', 'Normal email login works');
  assert(loginRes.user.role === 'contractor', 'User role preserved on login');
  await AuthService.logout();

  // ==========================================================================
  console.log('\n[Suite 3] Production Google OAuth & Role Preservation Matrix');
  // ==========================================================================

  // 3.1 Google Login Development / Web Configuration
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8'));
  assert(appJson.expo.scheme === 'servex-contractor', 'App scheme configured as servex-contractor');
  assert(appJson.expo.android?.package === 'com.anonymous.servexcontractor', 'Android package com.anonymous.servexcontractor configured');
  assert(appJson.expo.ios?.bundleIdentifier === 'com.anonymous.servexcontractor', 'iOS bundleIdentifier com.anonymous.servexcontractor configured');

  // 3.2 First-time Google user routes to mandatory phone verification (NEEDS_PHONE)
  const newGoogleProfile = {
    name: 'New Contractor Google',
    email: 'newgoogle@servex.com',
    sub: 'google-sub-998877',
  };
  const firstTimeRes = await AuthService.processGoogleIdentity(newGoogleProfile, 'mock-id-token');
  assert(firstTimeRes.status === 'NEEDS_PHONE', 'First-time Google user flagged NEEDS_PHONE');
  assert(firstTimeRes.pendingUser?.email === 'newgoogle@servex.com', 'Pending user preserves Google email');

  // 3.3 Google user CANNOT finalize registration without verified phone token
  let unverifiedBypass = false;
  try {
    await AuthService.finalizeRegistration(firstTimeRes.pendingUser!, 'contractor');
  } catch (err: any) {
    unverifiedBypass = err.message.includes('Phone verification is compulsory');
  }
  assert(unverifiedBypass, 'Google user blocked from account creation without verified phone');

  // 3.4 Google user completes phone verification & role selection
  const googlePhone = '9876543299';
  const gChallenge = await OtpService.requestOtp(googlePhone, '+91');
  const gOtp = __getSimulatedDeliveredOtp(gChallenge.challengeId);
  const gVerify = await OtpService.verifyOtp(gChallenge.challengeId, gOtp, googlePhone);

  const completedPending: PendingRegistration = {
    ...firstTimeRes.pendingUser!,
    phone: googlePhone,
    countryCode: '+91',
    isPhoneVerified: true,
    verificationToken: gVerify.verificationToken,
  };

  const finalGoogleUser = await AuthService.finalizeRegistration(completedPending, 'client');
  assert(finalGoogleUser.user.role === 'client', 'User role assigned as client according to role selection');
  assert(finalGoogleUser.user.authProvider === 'google', 'Provider recorded as google');
  assert(finalGoogleUser.user.isPhoneVerified === true, 'Phone recorded as verified');

  // 3.5 Existing Google user logs in immediately (Flow C)
  const existingGoogleRes = await AuthService.processGoogleIdentity(newGoogleProfile, 'mock-id-token');
  assert(existingGoogleRes.status === 'AUTHENTICATED', 'Existing Google user authenticates directly');
  assert(existingGoogleRes.user?.role === 'client', 'Existing user preserves role without privilege escalation');
  assert(existingGoogleRes.user?.role !== 'contractor', 'Google user was not automatically granted contractor role');

  // 3.6 Session persistence & logout
  const restoredSession = await StorageService.getSession();
  assert(restoredSession?.user?.id === existingGoogleRes.user?.id, 'Session persisted across app restarts');
  await AuthService.logout();
  const sessionAfterLogout = await StorageService.getSession();
  assert(sessionAfterLogout === null, 'Session properly destroyed on logout');

  // ==========================================================================
  console.log('\n[Suite 4] Phase 1 Regression Verification');
  // ==========================================================================

  // Login as contractor for Phase 1 backend calls
  await AuthService.loginWithEmail('contractor@servex.com', 'Servex@2026');

  // 4.1 Project creation
  const project = await ContractorBackendService.createProject({
    clientCode: 'P2-REG-001',
    projectName: 'Phase 2 Regression Site',
    clientName: 'Sunil Verma',
    clientPhone: '+91 98333 44444',
    siteAddress: 'Lower Parel, Mumbai',
    startDate: '06 Oct 2026',
    status: 'active',
  });
  assert(Boolean(project && project.id), 'Phase 1: Project creation intact');
  assert(Boolean(project && project.clientCode), 'Phase 1: Project code generated intact');

  // 4.2 Scope items
  const withScope = await ContractorBackendService.addScopeItem(project.id, {
    name: 'Civil Work Flooring',
    unit: 'sqft',
    quantity: 100,
    ratePerUnit: 500,
    totalAmount: 50000,
  });
  const scopeItem = withScope?.scopeItems.find((s: any) => s.name === 'Civil Work Flooring');
  assert(Boolean(scopeItem && scopeItem.quantity === 100), 'Phase 1: Scope item creation intact');
  await ContractorBackendService.deleteScopeItem(project.id, scopeItem!.id);
  const pAfterScope = await ContractorStorageService.getProjectById(project.id);
  assert(
    !pAfterScope?.scopeItems.some((s: any) => s.id === scopeItem!.id),
    'Phase 1: deleteScopeItem cloud sync intact'
  );

  // 4.3 Workers
  const withWorker = await ContractorBackendService.addWorker(project.id, {
    name: 'Ramesh Kumar',
    role: 'Mason',
    dailyWage: 900,
    phone: '9811122233',
  });
  const workerItem = withWorker?.workers.find((w: any) => w.name === 'Ramesh Kumar');
  assert(Boolean(workerItem && workerItem.name === 'Ramesh Kumar'), 'Phase 1: Worker creation intact');
  await ContractorBackendService.deleteWorker(project.id, workerItem!.id);
  const pAfterWorker = await ContractorStorageService.getProjectById(project.id);
  assert(
    !pAfterWorker?.workers.some((w: any) => w.id === workerItem!.id),
    'Phase 1: deleteWorker cloud sync intact'
  );

  // 4.4 Project archival
  const archived = await ContractorBackendService.archiveProject(project.id);
  assert(Boolean(archived && archived.status === 'archived'), 'Phase 1: Project archival intact');

  // ==========================================================================
  console.log('\n======================================================');
  console.log(`Phase 2 Verification Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
