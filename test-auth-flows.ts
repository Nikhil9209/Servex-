import { AuthService } from './src/services/authService';
import { StorageService } from './src/services/storage';
import { PendingRegistration } from './src/types/auth';

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

async function runAllTests() {
  console.log('\n=== Servex Production Authentication Test Suite ===\n');

  // Clear any existing session before test start
  await StorageService.clearSession();

  // Test 1: Flow E (Initial unauthenticated launch)
  console.log('[Test Suite 1] Initial App Launch & Session Guard');
  const initialSession = await StorageService.getSession();
  assert(initialSession === null, 'Session is null on fresh unauthenticated launch');

  // Test 2: Flow D (Existing Email User Login)
  console.log('\n[Test Suite 2] Flow D - Existing Email User Login');
  // 2a. Invalid password
  let invalidPassCaught = false;
  try {
    await AuthService.loginWithEmail('client@servex.com', 'WrongPassword123');
  } catch (err: any) {
    invalidPassCaught = true;
    assert(err.message.includes('Incorrect password'), 'Rejects incorrect password');
  }
  assert(invalidPassCaught, 'Throws on wrong password');

  // 2b. Valid credentials
  const { user: clientUser, session: clientSession } = await AuthService.loginWithEmail(
    'client@servex.com',
    'Servex@2026'
  );
  assert(clientUser.email === 'client@servex.com', 'Client user email matches');
  assert(clientUser.role === 'client', 'Client user role is client');
  assert(clientUser.isPhoneVerified === true, 'Existing user phone is verified');
  assert(Boolean(clientSession.token), 'Valid session token generated');

  // Verify Session Persistence
  const persistedSession = await StorageService.getSession();
  assert(persistedSession?.user.email === 'client@servex.com', 'Session persists in storage');

  // Test 3: Flow F (Logout)
  console.log('\n[Test Suite 3] Flow F - Logout & Session Purge');
  await AuthService.logout();
  const sessionAfterLogout = await StorageService.getSession();
  assert(sessionAfterLogout === null, 'Session completely cleared after logout');

  // Test 4: Duplicate Email & Phone Validations
  console.log('\n[Test Suite 4] Validation Rules & Duplicate Detection');
  const isEmailDup = await AuthService.isEmailRegistered('client@servex.com');
  assert(isEmailDup, 'Detects duplicate email');

  const isPhoneDup = await AuthService.isPhoneRegistered('9876543210', '+91');
  assert(isPhoneDup, 'Detects duplicate phone number');

  assert(AuthService.isValidEmail('test@servex.com'), 'Validates correct email format');
  assert(!AuthService.isValidEmail('invalid-email'), 'Rejects malformed email');
  assert(AuthService.isValidPhone('9876543210'), 'Validates 10-digit phone');
  assert(!AuthService.isValidPhone('123'), 'Rejects short phone');

  // Test 5: Flow A (New Email Registration Flow)
  console.log('\n[Test Suite 5] Flow A - New Email Registration, OTP, Role Selection');
  const newEmail = `contractor_${Date.now()}@servex.com`;
  const newPhone = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

  const pendingEmailUser: PendingRegistration = {
    name: 'Devin Contractor',
    email: newEmail,
    phone: '',
    countryCode: '+91',
    passwordHash: 'SecurePass@2026',
    authProvider: 'email',
    otpCode: '',
    otpExpiresAt: 0,
    otpLastSentAt: 0,
  };

  // Step 5a: Request OTP
  const withOtp = await AuthService.requestOtpForPhone(pendingEmailUser, newPhone, '+91');
  assert(withOtp.phone === newPhone, 'Phone number captured in pending registration');
  assert(withOtp.otpCode.length === 6, '6-digit OTP code generated');
  assert(withOtp.otpExpiresAt > Date.now(), 'OTP expiry timestamp set 5 minutes ahead');

  // Step 5b: Incorrect OTP rejection
  let badOtpCaught = false;
  try {
    AuthService.verifyOtp(withOtp, '000000');
  } catch (err: any) {
    badOtpCaught = true;
    assert(err.message.includes('Incorrect verification code'), 'Rejects incorrect OTP');
  }
  assert(badOtpCaught, 'Throws on wrong OTP');

  // Step 5c: Expired OTP rejection
  const expiredPending = { ...withOtp, otpExpiresAt: Date.now() - 1000 };
  let expiredOtpCaught = false;
  try {
    AuthService.verifyOtp(expiredPending, withOtp.otpCode);
  } catch (err: any) {
    expiredOtpCaught = true;
    assert(err.message.includes('expired'), 'Rejects expired OTP');
  }
  assert(expiredOtpCaught, 'Throws on expired OTP');

  // Step 5d: Successful OTP verification
  const isOtpValid = AuthService.verifyOtp(withOtp, withOtp.otpCode);
  assert(isOtpValid === true, 'Verifies correct 6-digit OTP');

  // Step 5e: Role selection -> Contractor
  const { user: registeredContractor, session: regSession } =
    await AuthService.finalizeRegistration(withOtp, 'contractor');
  assert(registeredContractor.name === 'Devin Contractor', 'Registered contractor name saved');
  assert(registeredContractor.role === 'contractor', 'Registered role is contractor');
  assert(registeredContractor.isPhoneVerified === true, 'Phone is verified');
  assert(regSession.token.startsWith('srvx_sess_'), 'Session active after registration');

  // Test 6: Flow B (New Google User -> Mandatory Phone -> OTP -> Role Selection)
  console.log('\n[Test Suite 6] Flow B - New Google User Mandatory Phone & Account Creation');
  const googleEmail = `newgoogle_${Date.now()}@gmail.com`;
  const pendingGoogleUser: PendingRegistration = {
    name: 'Google Newcomer',
    email: googleEmail,
    phone: '',
    countryCode: '+91',
    authProvider: 'google',
    googleSub: `gsub_${Date.now()}`,
    otpCode: '',
    otpExpiresAt: 0,
    otpLastSentAt: 0,
  };

  const googlePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const googleWithOtp = await AuthService.requestOtpForPhone(pendingGoogleUser, googlePhone, '+91');
  assert(googleWithOtp.phone === googlePhone, 'Captures mandatory phone for Google user');
  assert(AuthService.verifyOtp(googleWithOtp, googleWithOtp.otpCode), 'Verifies OTP for Google user');

  // Select Client Role
  const { user: googleClientUser } = await AuthService.finalizeRegistration(
    googleWithOtp,
    'client'
  );
  assert(googleClientUser.email === googleEmail, 'Google user email preserved');
  assert(googleClientUser.role === 'client', 'Role assigned as client');
  assert(googleClientUser.authProvider === 'google', 'Provider is google');
  assert(googleClientUser.isPhoneVerified === true, 'Phone marked verified');

  // Test 7: Flow C (Existing Google User Direct Sign-In)
  console.log('\n[Test Suite 7] Flow C - Existing Google User Immediate Entry');
  // Registered user Priya Sharma (priya.sharma@gmail.com) already in pool with verified phone and contractor role
  const existingGoogleResult = await StorageService.getRegisteredUsers();
  const priya = existingGoogleResult.find((u) => u.email === 'priya.sharma@gmail.com');
  assert(Boolean(priya), 'Found existing Google account in registered pool');
  assert(priya?.role === 'contractor', 'Existing Google user has contractor role');
  assert(priya?.isPhoneVerified === true, 'Existing Google user has verified phone');

  // Test 8: Flow E (Returning Authenticated User Session Check)
  console.log('\n[Test Suite 8] Flow E - Returning Authenticated User Check');
  const savedCurrentSession = await StorageService.getSession();
  assert(savedCurrentSession !== null, 'Session is valid upon reopen');
  assert(savedCurrentSession?.user.email === googleEmail, 'Identifies returning user directly');

  // Test 9: SMS Gateway & Delivery Provider Verification
  console.log('\n[Test Suite 9] SMS Gateway & Delivery Provider Verification');
  const { SmsService } = await import('./src/services/smsService');
  const simResult = await SmsService.sendOtpSms('9876543210', '+91', '123456');
  assert(simResult.success === true, 'SmsService dispatches successfully');
  assert(
    simResult.provider === 'simulation' || simResult.provider === 'fast2sms' || simResult.provider === 'twilio',
    'SmsService provider is identified'
  );
  assert(withOtp.smsDeliveryProvider !== undefined, 'AuthService stores SMS delivery provider');

  // Test 10: Flow G - Progressive Verification & Verify Later
  console.log('\n[Test Suite 10] Flow G - Progressive Verification & Verify Later');
  const progressiveEmail = `builder_${Date.now()}@servex.com`;
  const pendingBuilder: PendingRegistration = {
    name: 'Vikram Builder',
    email: progressiveEmail,
    phone: '9812345678',
    countryCode: '+91',
    passwordHash: 'BuilderPass@2026',
    authProvider: 'email',
    otpCode: '112233',
    otpExpiresAt: Date.now() + 300000,
    otpLastSentAt: Date.now(),
    isPhoneVerified: false, // User tapped "Verify phone later"
  };

  const { user: builderUser, session: builderSession } = await AuthService.finalizeRegistration(
    pendingBuilder,
    'contractor'
  );
  assert(builderUser.name === 'Vikram Builder', 'Builder name saved');
  assert(builderUser.phone === '9812345678', 'Phone number preserved on profile');
  assert(builderUser.isPhoneVerified === false, 'Phone marked unverified pending future verification');
  assert(Boolean(builderSession.token), 'Instant entry session token generated without blocking');

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
