// ==============================================================================
// SERVEX REMEDIATION 1 VERIFICATION TEST SUITE
// Verifies removal of SMS gateway private credentials from client bundle
// and enforcement of secure server-side dispatch architecture
// ==============================================================================

import { SmsService } from '../src/services/smsService';
import { validateSmsPayload } from '../supabase/functions/send-otp-sms/index';

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

async function runRemediation1Tests() {
  console.log('\n======================================================');
  console.log('   STAGE 5 — REMEDIATION 1: SMS CREDENTIAL SECURITY  ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 1: CLIENT SOURCE & BUNDLE CONFIGURATION VERIFICATION
  // --------------------------------------------------------------------------
  console.log('[Test Suite 1] Client Source & Bundle Secret Isolation');

  const smsServiceSource: string = fs.readFileSync(
    path.join(__dirname, '../src/services/smsService.ts'),
    'utf8'
  );

  assert(
    !smsServiceSource.includes('EXPO_PUBLIC_FAST2SMS_API_KEY'),
    'EXPO_PUBLIC_FAST2SMS_API_KEY is completely removed from client smsService.ts'
  );

  assert(
    !smsServiceSource.includes('EXPO_PUBLIC_TWILIO_AUTH_TOKEN'),
    'EXPO_PUBLIC_TWILIO_AUTH_TOKEN is completely removed from client smsService.ts'
  );

  assert(
    !smsServiceSource.includes('EXPO_PUBLIC_TWILIO_ACCOUNT_SID'),
    'EXPO_PUBLIC_TWILIO_ACCOUNT_SID is completely removed from client smsService.ts'
  );

  assert(
    !smsServiceSource.includes('EXPO_PUBLIC_TWILIO_PHONE_NUMBER'),
    'EXPO_PUBLIC_TWILIO_PHONE_NUMBER is completely removed from client smsService.ts'
  );

  assert(
    !smsServiceSource.includes('https://api.twilio.com'),
    'Direct Twilio REST API endpoints removed from client bundle'
  );

  assert(
    !smsServiceSource.includes('https://www.fast2sms.com'),
    'Direct Fast2SMS REST API endpoints removed from client bundle'
  );

  assert(
    !smsServiceSource.includes('safeBase64'),
    'Client-side basic auth credentials encoding removed'
  );

  // Check .env.example
  const envExampleContent: string = fs.readFileSync(
    path.join(__dirname, '../.env.example'),
    'utf8'
  );

  assert(
    !envExampleContent.includes('EXPO_PUBLIC_FAST2SMS_API_KEY'),
    '.env.example does not instruct developers to use EXPO_PUBLIC_FAST2SMS_API_KEY'
  );

  assert(
    !envExampleContent.includes('EXPO_PUBLIC_TWILIO_AUTH_TOKEN'),
    '.env.example does not instruct developers to use EXPO_PUBLIC_TWILIO_AUTH_TOKEN'
  );

  assert(
    envExampleContent.includes('SERVER-SIDE ONLY CONFIGURATION'),
    '.env.example documents that SMS credentials belong on server side only'
  );

  // --------------------------------------------------------------------------
  // TEST SUITE 2: REPOSITORY SCAN FOR EXPO_PUBLIC SMS LEAKS
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 2] Repository Scan for EXPO_PUBLIC SMS Leaks');

  const srcDir: string = path.join(__dirname, '../src');
  function scanDir(dir: string): string[] {
    let results: string[] = [];
    const list: string[] = fs.readdirSync(dir);
    list.forEach((file: string) => {
      const fullPath: string = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  const allSrcFiles = scanDir(srcDir);
  let leakFound = false;
  for (const f of allSrcFiles) {
    const content: string = fs.readFileSync(f, 'utf8');
    if (
      content.includes('EXPO_PUBLIC_FAST2SMS') ||
      content.includes('EXPO_PUBLIC_TWILIO')
    ) {
      leakFound = true;
      console.error(`Leak found in: ${f}`);
    }
  }

  assert(!leakFound, 'Zero EXPO_PUBLIC_FAST2SMS or EXPO_PUBLIC_TWILIO references in src/ directory');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: EDGE FUNCTION VALIDATION & ABUSE PREVENTION
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 3] Edge Function Input Validation & Abuse Prevention');

  // 3a. Null / invalid payload
  const nullValidation = validateSmsPayload(null);
  assert(!nullValidation.valid, 'Rejects null payload');

  // 3b. Missing phone number
  const missingPhone = validateSmsPayload({ otpCode: '123456', countryCode: '+91' });
  assert(!missingPhone.valid && missingPhone.error?.includes('Phone number'), 'Rejects missing phone number');

  // 3c. Invalid phone format (short)
  const shortPhone = validateSmsPayload({ phoneNumber: '12345', countryCode: '+91', otpCode: '123456' });
  assert(!shortPhone.valid && shortPhone.error?.includes('Invalid phone number'), 'Rejects short/invalid phone numbers');

  // 3d. Missing OTP
  const missingOtp = validateSmsPayload({ phoneNumber: '9876543210', countryCode: '+91' });
  assert(!missingOtp.valid && missingOtp.error?.includes('OTP code'), 'Rejects missing OTP code');

  // 3e. Malformed OTP (not 6 digits)
  const badOtpLetters = validateSmsPayload({ phoneNumber: '9876543210', countryCode: '+91', otpCode: 'ABCDEF' });
  assert(!badOtpLetters.valid && badOtpLetters.error?.includes('6 numeric digits'), 'Rejects non-numeric OTP');

  const badOtpLength = validateSmsPayload({ phoneNumber: '9876543210', countryCode: '+91', otpCode: '1234' });
  assert(!badOtpLength.valid && badOtpLength.error?.includes('6 numeric digits'), 'Rejects 4-digit OTP');

  // 3f. Valid input
  const validPayload = validateSmsPayload({ phoneNumber: '+91 98765 43210', countryCode: '+91', otpCode: '982104' });
  assert(validPayload.valid === true, 'Accepts valid phone and 6-digit OTP');
  assert(validPayload.cleanPhone === '919876543210', 'Sanitizes phone to digits');
  assert(validPayload.cleanOtp === '982104', 'Extracts exact 6-digit OTP');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: CLIENT DISPATCH & SECRET HYGIENE
  // --------------------------------------------------------------------------
  console.log('\n[Test Suite 4] Client Dispatch & Response Secret Hygiene');

  const dispatchResult = await SmsService.sendOtpSms('9876543210', '+91', '654321');
  assert(dispatchResult.success === true, 'SmsService.sendOtpSms executes successfully');
  assert(
    dispatchResult.provider === 'simulation' ||
      dispatchResult.provider === 'fast2sms' ||
      dispatchResult.provider === 'twilio',
    'SmsService identifies valid delivery provider'
  );

  // Assert response object contains NO secret properties
  const keys = Object.keys(dispatchResult);
  assert(!keys.includes('apiKey'), 'Result does not contain apiKey');
  assert(!keys.includes('authToken'), 'Result does not contain authToken');
  assert(!keys.includes('password'), 'Result does not contain password');
  assert(!keys.includes('token'), 'Result does not contain token');

  // Verify response string does not expose secrets
  const resultJson = JSON.stringify(dispatchResult);
  assert(!resultJson.includes('secret') && !resultJson.includes('key'), 'Result payload is clean of sensitive data');

  console.log('\n======================================================');
  console.log(`Remediation 1 Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRemediation1Tests().catch((err) => {
  console.error('Fatal error during Remediation 1 verification:', err);
  process.exit(1);
});
