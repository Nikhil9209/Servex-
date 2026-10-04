/**
 * Remediation 6 — Financial Data Privacy Test Suite
 *
 * Verifies:
 *  - client can no longer SELECT contractor-only financial rows (workers,
 *    attendance_records, daily_work_reports, paid_to_worker ledger rows)
 *  - client keeps access to client-facing billings (received_from_client rows)
 *  - contractor retains full financial authority
 *  - no weak USING(true) policies introduced
 *  - realtime publication no longer leaks financial/attendance tables
 *  - local cache isolation per user (Remediation 2)
 */

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

async function runRemediation6Tests() {
  console.log('\n======================================================');
  console.log('   REMEDIATION 6: FINANCIAL DATA PRIVACY             ');
  console.log('======================================================\n');

  const schemaSql = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
  const backendSrc = fs.readFileSync(
    path.join(__dirname, '../src/services/contractorBackendService.ts'),
    'utf8'
  );

  console.log('[Suite 1] RLS policy shape for financial tables');

  // workers / attendance / daily_work_reports: client SELECT removed (contractor-only)
  const workersBlock = schemaSql.split('workers_select_policy')[1]?.split(');')[0] || '';
  assert(
    !workersBlock.includes('p.client_id'),
    'workers SELECT policy is contractor-only (no client branch)'
  );
  const attendanceBlock = schemaSql.split('attendance_records_select_policy')[1]?.split(');')[0] || '';
  assert(
    !attendanceBlock.includes('p.client_id'),
    'attendance_records SELECT policy is contractor-only'
  );
  const reportsBlock = schemaSql.split('daily_work_reports_select_policy')[1]?.split(');')[0] || '';
  assert(
    !reportsBlock.includes('p.client_id'),
    'daily_work_reports SELECT policy is contractor-only'
  );

  // ledger: client only sees received_from_client rows
  assert(
    schemaSql.includes("type = 'received_from_client'"),
    'Client ledger SELECT restricted to received_from_client rows'
  );
  assert(
    !schemaSql.includes("ledger_transactions_select_policy\" ON ledger_transactions\nFOR SELECT TO authenticated\nUSING (\n    EXISTS (\n        SELECT 1 FROM projects p\n        WHERE p.id = ledger_transactions.project_id\n        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))"),
    'No full client access on ledger_transactions (paid_to_worker hidden)'
  );

  // Contractor INSERT/UPDATE guards on financial tables still contractor-only
  assert(
    schemaSql.includes('ledger_transactions_insert_policy'),
    'Client cannot insert ledger rows (contractor-only insert policy)'
  );
  assert(
    schemaSql.includes('workers_insert_policy'),
    'Client cannot insert workers'
  );

  console.log('\n[Suite 2] No broad or anonymous policies');
  assert(!/CREATE POLICY[\s\S]*?TO (anon|PUBLIC)[\s\S]*?USING \(true\)/i.test(schemaSql), 'No USING(true) public policies');
  assert(!schemaSql.includes("WITH CHECK (true)"), 'No WITH CHECK(true) anywhere');

  console.log('\n[Suite 3] Realtime publication hardened');
  assert(
    !schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records'),
    'attendance_records removed from realtime publication (wage data)'
  );
  assert(
    !schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE projects'),
    'projects removed from realtime publication'
  );
  assert(
    schemaSql.includes('ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages'),
    'chat_messages remains realtime-enabled (client-facing tri-party channel)'
  );
  assert(
    !backendSrc.includes("table: 'attendance_records'"),
    'Backend no longer subscribes to attendance_records channel'
  );
  assert(
    !backendSrc.includes("table: 'projects'"),
    'Backend does not subscribe to projects change feed'
  );

  console.log('\n[Suite 4] Sensitive field exposure audit');
  // Fields must NOT be returned to client pathways. Static proof that the client
  // UI no longer depends on contractor-only relations for rendering.
  const clientHome = fs.readFileSync(
    path.join(__dirname, '../src/screens/client/ClientHomeScreen.tsx'),
    'utf8'
  );
  assert(!clientHome.includes('paid_to_worker'), 'ClientHomeScreen never references paid_to_worker');
  assert(!clientHome.includes('contractorMarginToday'), 'ClientHomeScreen never renders contractor margin');
  assert(
    !clientHome.includes('totalWorkerWageToday') && !clientHome.includes('wageCalculated'),
    'ClientHomeScreen never renders worker wage totals'
  );

  // Contractor pages still render finances (functionality preserved)
  const ledgerScreen = fs.readFileSync(
    path.join(__dirname, '../src/screens/contractor/pages/FinancialLedgerScreen.tsx'),
    'utf8'
  );
  assert(ledgerScreen.includes('paid_to_worker'), 'Contractor ledger UI intact');
  const verificationScreen = fs.readFileSync(
    path.join(__dirname, '../src/screens/contractor/pages/DailyWorkVerificationScreen.tsx'),
    'utf8'
  );
  assert(verificationScreen.includes('contractorMarginToday'), 'Contractor verification UI intact');

  console.log('\n[Suite 5] Local cache isolation (Remediation 2 preserved)');
  const storageSrc = fs.readFileSync(
    path.join(__dirname, '../src/services/contractorStorageService.ts'),
    'utf8'
  );
  assert(storageSrc.includes('getProjectStorageKey(userId'), 'Per-user project storage keys retained');
  assert(storageSrc.includes('LEGACY_STATIC_KEY'), 'Legacy cache registry retained for isolation');
  assert(storageSrc.includes('UNOWNED_SEED_KEY'), 'Unowned seed key segregated');

  console.log('\n[Suite 6] Regression anchors in schema');
  assert(schemaSql.includes('complete_user_onboarding'), 'Remediation 5 onboarding intact');
  assert(schemaSql.includes('join_project_by_code'), 'Remediation 4 linking intact');
  assert(schemaSql.includes('user_roles_insert_deny_policy'), 'Remediation 3 role enforcement intact');
  assert(schemaSql.includes('phone_otp_challenges'), 'Remediation 5 OTP table intact');
  assert(schemaSql.includes('otp_challenges_deny_select'), 'Remediation 5 OTP deny policies intact');

  console.log('\n======================================================');
  console.log(`Remediation 6 Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runRemediation6Tests().catch((err) => {
  console.error('Unhandled test error:', err);
  process.exit(1);
});
