/**
 * Servex Production SMS Delivery Service
 * Supports live dispatch via Fast2SMS (India) and Twilio (Global),
 * with safe local simulation and delivery verification.
 */

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  provider: 'twilio' | 'fast2sms' | 'simulation';
  error?: string;
}

/**
 * Universal Base64 encoder compatible with React Native (Hermes), Web, and Node.js
 */
function safeBase64(input: string): string {
  if (typeof btoa === 'function') {
    return btoa(input);
  }
  const globalBuffer = (globalThis as any)?.Buffer;
  if (globalBuffer) {
    return globalBuffer.from(input).toString('base64');
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, idx = 0, map = chars;
    input.charAt(idx | 0) || ((map = '='), idx % 1);
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))
  ) {
    charCode = input.charCodeAt((idx += 3 / 4));
    block = (block << 8) | charCode;
  }
  return output;
}

export const SmsService = {
  /**
   * Dispatches a real 6-digit OTP via configured SMS gateway provider
   */
  async sendOtpSms(
    phoneNumber: string,
    countryCode: string,
    otpCode: string
  ): Promise<SmsSendResult> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const cleanCountry = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;
    const fullNumber = `${cleanCountry}${cleanPhone}`;
    const message = `Your Servex verification code is ${otpCode}. Valid for 5 minutes. Do not share this code.`;

    const fast2smsKey = process.env.EXPO_PUBLIC_FAST2SMS_API_KEY;
    const twilioSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER;

    // 1. Fast2SMS (Optimized for India +91 numbers)
    if (fast2smsKey && (cleanCountry === '+91' || cleanCountry === '+091')) {
      const indianTenDigit = cleanPhone.slice(-10);
      try {
        console.log(`[SmsService] Dispatching live cellular SMS via Fast2SMS to +91 ${indianTenDigit}...`);

        // Attempt 1: Fast2SMS Dedicated OTP Route
        let response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otpCode,
            numbers: indianTenDigit,
          }),
        });

        let data = await response.json();

        // Attempt 2: If OTP route requires website verification or fails, fallback to Quick SMS route ('q')
        if (!data.return) {
          console.warn('[SmsService] Fast2SMS OTP route returned:', data.message, '- attempting Quick SMS route (q)...');
          response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: fast2smsKey.trim(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'q',
              message: `Your Servex verification code is ${otpCode}. Valid for 5 minutes. Do not share this code.`,
              language: 'english',
              flash: 0,
              numbers: indianTenDigit,
            }),
          });
          data = await response.json();
        }

        if (data.return) {
          console.log(`[SmsService] Real SMS delivered to +91 ${indianTenDigit} via Fast2SMS. Request ID: ${data.request_id}`);
          return { success: true, messageId: data.request_id, provider: 'fast2sms' };
        } else {
          const errMsg = Array.isArray(data.message) ? data.message.join(', ') : String(data.message || 'Fast2SMS dispatch failed');
          console.warn('[SmsService] Fast2SMS returned error:', errMsg);
          return { success: false, provider: 'fast2sms', error: errMsg };
        }
      } catch (err: any) {
        console.warn('[SmsService] Fast2SMS network error:', err?.message);
        return { success: false, provider: 'fast2sms', error: err?.message };
      }
    }

    // 2. Twilio (Global cellular SMS gateway)
    if (twilioSid && twilioAuth && twilioFrom) {
      try {
        console.log(`[SmsService] Dispatching live cellular SMS via Twilio to ${fullNumber}...`);
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid.trim()}/Messages.json`;
        const params = new URLSearchParams({
          To: fullNumber,
          From: twilioFrom.trim(),
          Body: message,
        });

        const authHeader = 'Basic ' + safeBase64(`${twilioSid.trim()}:${twilioAuth.trim()}`);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        const data = await response.json();
        if (data.sid) {
          console.log(`[SmsService] Real SMS delivered to ${fullNumber} via Twilio. SID: ${data.sid}`);
          return { success: true, messageId: data.sid, provider: 'twilio' };
        } else {
          console.warn('[SmsService] Twilio returned error:', data.message);
          return { success: false, provider: 'twilio', error: data.message };
        }
      } catch (err: any) {
        console.warn('[SmsService] Twilio network error:', err?.message);
        return { success: false, provider: 'twilio', error: err?.message };
      }
    }

    // 3. Development Simulation (when SMS gateway credentials are not yet entered)
    console.log(`\n================================================================`);
    console.log(`📱 [SERVEX SMS GATEWAY - SIMULATION MODE]`);
    console.log(`Recipient: ${fullNumber}`);
    console.log(`Content: "${message}"`);
    console.log(`Status: DISPATCHED (Simulation)`);
    console.log(`Tip: Add EXPO_PUBLIC_FAST2SMS_API_KEY in .env for live SMS to physical phones`);
    console.log(`================================================================\n`);

    return { success: true, provider: 'simulation' };
  },
};

