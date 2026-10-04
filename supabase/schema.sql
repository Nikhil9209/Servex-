-- ==============================================================================
-- SERVEX CONTRACTOR PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- 1. Projects Master Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_code VARCHAR(32) NOT NULL UNIQUE,
    project_name TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone VARCHAR(32) NOT NULL,
    site_address TEXT NOT NULL,
    start_date VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'completed')),
    worker_messaging_allowed BOOLEAN DEFAULT FALSE,
    contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    code_created_at TIMESTAMPTZ DEFAULT NOW(),
    code_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for instant lookup by Client Code and Ownership
CREATE INDEX IF NOT EXISTS idx_projects_client_code ON projects (client_code);
CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects (contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);

-- 2. Scope & Requirement Items (Requirements & Rates / Work Done)
CREATE TABLE IF NOT EXISTS scope_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit VARCHAR(16) NOT NULL CHECK (unit IN ('sqft', 'rft', 'cft', 'nos', 'meter')),
    quantity NUMERIC NOT NULL DEFAULT 0,
    rate_per_unit NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    completed_quantity NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scope_items_project_id ON scope_items (project_id);

-- 3. Workers Registry
CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role VARCHAR(32) NOT NULL,
    daily_wage NUMERIC NOT NULL DEFAULT 0,
    phone VARCHAR(32) DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_project_id ON workers (project_id);

-- 4. Daily Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    worker_id TEXT NOT NULL,
    worker_name TEXT NOT NULL,
    role VARCHAR(32) NOT NULL,
    daily_wage NUMERIC NOT NULL DEFAULT 0,
    date VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('present', 'absent', 'half_day')),
    check_in_time VARCHAR(32) DEFAULT '09:00 AM',
    proof_verified BOOLEAN DEFAULT FALSE,
    proof_note TEXT DEFAULT '',
    wage_calculated NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_project_worker_date UNIQUE (project_id, worker_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON attendance_records (project_id, date);

-- 5. Daily Work Verification Reports (Audited inspection logs)
CREATE TABLE IF NOT EXISTS daily_work_reports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date VARCHAR(64) NOT NULL,
    verified_by TEXT NOT NULL,
    items_json JSONB DEFAULT '[]'::jsonb,
    total_work_value_today NUMERIC NOT NULL DEFAULT 0,
    total_worker_wage_today NUMERIC NOT NULL DEFAULT 0,
    contractor_margin_today NUMERIC NOT NULL DEFAULT 0,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON daily_work_reports (project_id);

-- 6. Financial Ledger & Cashflow Transactions
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date VARCHAR(64) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    type VARCHAR(32) NOT NULL CHECK (type IN ('received_from_client', 'paid_to_worker')),
    note TEXT NOT NULL,
    recipient_or_payer TEXT NOT NULL,
    reference_no VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON ledger_transactions (project_id);

-- 7. Tri-Party Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_role VARCHAR(16) NOT NULL CHECK (sender_role IN ('contractor', 'client', 'worker')),
    sender_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp VARCHAR(32) NOT NULL,
    is_authority_action BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages (project_id);

-- ==============================================================================
-- REALTIME ENABLEMENT
-- ==============================================================================
-- Chat messages are kept out of the realtime publication: postgres_changes
-- events are not RLS-scoped, so publishing them would leak cross-project chat.
-- Chat updates propagate through RLS-protected REST reads instead.
-- In a later hardening phase, chat may move to Supabase Realtime private
-- channels enforced by realtime.messages RLS policies.

-- ==============================================================================
-- INITIAL SEED DATA (Servex Skyline Penthouse & Apex Tech Park)
-- ==============================================================================
-- Note: contractor_id and client_id are explicitly NULL for pre-seeded projects.
-- Existing unmapped projects require controlled migration/linking when claimed by verified Supabase Auth accounts.
INSERT INTO projects (id, client_code, project_name, client_name, client_phone, site_address, start_date, status, worker_messaging_allowed, contractor_id, client_id, code_created_at, code_expires_at)
VALUES 
('proj-1', 'CLT-8842', 'Skyline Penthouse Renovation', 'Vikramaditya Singhania', '+91 98201 12345', 'Flat 4201, Tower B, Worli Sea Face, Mumbai', '15 Sep 2026', 'active', true, NULL, NULL, NOW(), NOW() + INTERVAL '365 days'),
('proj-2', 'CLT-7721', 'Apex Tech Park HVAC Fitout', 'Pooja Hegde', '+91 98920 66778', 'Plot C-14, BKC G-Block, Bandra Kurla Complex, Mumbai', '01 Sep 2026', 'active', true, NULL, NULL, NOW(), NOW() + INTERVAL '365 days'),
('proj-3', 'CLT-9104', 'Bandra Retail Showroom Fitout', 'Karan Mehra', '+91 98333 77889', 'Ground Floor, Linking Road, Bandra West, Mumbai', '10 Oct 2026', 'upcoming', false, NULL, NULL, NOW(), NOW() + INTERVAL '365 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scope_items (id, project_id, name, unit, quantity, rate_per_unit, total_amount, completed_quantity)
VALUES
('sc-1', 'proj-1', 'Italian Marble Flooring & Skirting', 'sqft', 1850, 145, 268250, 1200),
('sc-2', 'proj-1', 'POP False Ceiling with Cove Profiles', 'sqft', 1600, 85, 136000, 950),
('sc-3', 'proj-1', 'Heavy Concealed Electrical Conduiting', 'rft', 2400, 48, 115200, 2100),
('sc-4', 'proj-1', 'Bathroom Waterproofing & Epoxy Grouting', 'sqft', 450, 120, 54000, 450),
('sc-5', 'proj-1', 'Royal Luxury Wall Emulsion & Primer', 'sqft', 4200, 35, 147000, 1800)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ledger_transactions (id, project_id, date, amount, type, note, recipient_or_payer, reference_no)
VALUES
('tx-1', 'proj-1', '18 Sep 2026', 150000, 'received_from_client', 'Mobilization Advance', 'Client: Vikramaditya Singhania', 'NEFT-HDFC-9912'),
('tx-2', 'proj-1', '22 Sep 2026', 120000, 'received_from_client', 'Running Account Bill 1 Payout', 'Client: Vikramaditya Singhania', 'IMPS-ICICI-8834'),
('tx-3', 'proj-1', '24 Sep 2026', 35000, 'paid_to_worker', 'Weekly Workforce Wages Payout', 'Site Labor Gang Lead', 'CASH-PAYROLL-01')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- STAGE 2 MIGRATION SCRIPT (For existing database instances)
-- ==============================================================================
-- Safe, idempotent addition of Supabase Auth ownership columns:
-- - Uses Supabase Auth auth.users(id) UUIDs as the authority.
-- - contractor_id: references auth.users(id) ON DELETE SET NULL.
-- - client_id: references auth.users(id) ON DELETE SET NULL, nullable.
-- - Preserves all existing data; existing unmapped projects safely receive NULL.
ALTER TABLE projects 
    ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_contractor_id ON projects (contractor_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects (client_id);

-- ==============================================================================
-- STAGE 3: SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- 1. Enable RLS on all business tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Realtime isolation: Full replica identity ensures RLS row filters work on Realtime CDC
ALTER TABLE projects REPLICA IDENTITY FULL;
ALTER TABLE attendance_records REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- 2B. Server-Authoritative User Roles & Helper Functions (Stage 5 — Remediation 3)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('contractor', 'client')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_id ON user_roles (id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read their own server-authoritative role
CREATE POLICY "user_roles_select_policy" ON user_roles
FOR SELECT TO authenticated
USING (
    id = (select auth.uid())
);

-- INSERT: Explicitly DENY direct client-side inserts. Roles are established strictly
-- via the PostgreSQL trigger on auth.users (email) or complete_user_onboarding() (OAuth).
CREATE POLICY "user_roles_insert_deny_policy" ON user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

-- UPDATE: Explicitly DENY all updates by authenticated users
CREATE POLICY "user_roles_update_deny_policy" ON user_roles
FOR UPDATE TO authenticated
USING (false)
WITH CHECK (false);

-- DELETE: Explicitly DENY all deletes by authenticated users
CREATE POLICY "user_roles_delete_deny_policy" ON user_roles
FOR DELETE TO authenticated
USING (false);

-- Helper functions with pinned search_path = public and SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_contractor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE id = auth.uid() AND role = 'contractor'
    );
$$;

REVOKE ALL ON FUNCTION is_contractor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_contractor() TO authenticated;

CREATE OR REPLACE FUNCTION is_client()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE id = auth.uid() AND role = 'client'
    );
$$;

REVOKE ALL ON FUNCTION is_client() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_client() TO authenticated;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM user_roles
    WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_my_role() TO authenticated;

-- assign_user_role: Safe role inquiry for existing users, rejects unassigned direct self-assignment
CREATE OR REPLACE FUNCTION assign_user_role(p_role TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to assign role';
    END IF;

    -- If user already has an authoritative role, return it safely (strictly immutable, prevents escalation)
    SELECT role INTO v_existing FROM public.user_roles WHERE id = v_uid;
    IF v_existing IS NOT NULL THEN
        RETURN v_existing;
    END IF;

    -- Unassigned authenticated users cannot directly self-assign roles via this RPC.
    -- Direct role assignment is strictly rejected to prevent privilege escalation.
    RAISE EXCEPTION 'Direct role assignment is unauthorized. Unassigned users must complete legitimate onboarding.';
END;
$$;

REVOKE ALL ON FUNCTION assign_user_role(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assign_user_role(TEXT) TO authenticated;

-- complete_user_onboarding: Authorized first-time role selection during legitimate onboarding (e.g. Google OAuth)
CREATE OR REPLACE FUNCTION complete_user_onboarding(
    p_role TEXT,
    p_phone TEXT,
    p_verification_token TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_existing TEXT;
    v_clean_phone TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required for onboarding';
    END IF;

    IF p_role NOT IN ('contractor', 'client') THEN
        RAISE EXCEPTION 'Invalid role: %', p_role;
    END IF;

    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    IF length(v_clean_phone) < 10 THEN
        RAISE EXCEPTION 'Valid phone number is mandatory for account onboarding';
    END IF;

    -- Strict verification token enforcement: mandatory single-use token
    IF p_verification_token IS NULL OR length(p_verification_token) < 32 THEN
        RAISE EXCEPTION 'Phone verification token is mandatory for account onboarding';
    END IF;

    -- Atomically verify and consume the single-use token
    IF NOT verify_and_consume_phone_token(v_clean_phone, p_verification_token) THEN
        RAISE EXCEPTION 'Invalid, expired, or already consumed phone verification token. Please verify your phone number again.';
    END IF;

    -- Check if user already has an authoritative role (strictly immutable)
    SELECT role INTO v_existing FROM public.user_roles WHERE id = v_uid;
    IF v_existing IS NOT NULL THEN
        RETURN v_existing;
    END IF;

    -- Insert authoritative role exactly once
    INSERT INTO public.user_roles (id, role)
    VALUES (v_uid, p_role)
    ON CONFLICT (id) DO NOTHING;

    RETURN p_role;
END;
$$;

REVOKE ALL ON FUNCTION complete_user_onboarding(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_user_onboarding(TEXT, TEXT, TEXT) TO authenticated;

-- Obsolete 2-argument overload removed: it created signature ambiguity and could never
-- verify a phone token. Any stale deployments must drop it explicitly.
DROP FUNCTION IF EXISTS complete_user_onboarding(TEXT, TEXT);

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT := NEW.raw_user_meta_data->>'role';
BEGIN
    IF v_role IN ('contractor', 'client') THEN
        INSERT INTO public.user_roles (id, role)
        VALUES (NEW.id, v_role)
        ON CONFLICT (id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_role();

-- 3. Projects Table Policies
-- SELECT: Authenticated contractor or linked client only
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT TO authenticated
USING (
    contractor_id = (select auth.uid())
    OR client_id = (select auth.uid())
);

-- INSERT: Contractor only; inserted contractor_id MUST match auth.uid() AND user must be verified contractor
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT TO authenticated
WITH CHECK (
    contractor_id = (select auth.uid())
    AND (client_id IS NULL OR client_id = (select auth.uid()))
    AND is_contractor()
);

-- UPDATE: Contractor only; cannot change contractor_id ownership or tamper with client_id
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE TO authenticated
USING (
    contractor_id = (select auth.uid())
)
WITH CHECK (
    contractor_id = (select auth.uid())
    AND client_id IS NOT DISTINCT FROM (
        SELECT p.client_id FROM projects p WHERE p.id = projects.id
    )
);

-- DELETE: Contractor only
CREATE POLICY "projects_delete_policy" ON projects
FOR DELETE TO authenticated
USING (
    contractor_id = (select auth.uid())
);

-- ==============================================================================
-- 4. REMEDIATION 4: PROJECT CODE RATE-LIMITING & ATTEMPT TRACKING
-- ==============================================================================
CREATE TABLE IF NOT EXISTS project_code_attempts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_attempts INT NOT NULL DEFAULT 0,
    first_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_code_attempts_locked ON project_code_attempts (user_id, locked_until);

ALTER TABLE project_code_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE project_code_attempts FROM PUBLIC;

-- 4. Secure Stored Function for Client Joining by Code
CREATE OR REPLACE FUNCTION join_project_by_code(p_client_code TEXT)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project projects%ROWTYPE;
    v_user_id UUID := auth.uid();
    v_attempt RECORD;
    v_clean_code TEXT;
BEGIN
    -- 1. Authentication requirement
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to join project';
    END IF;

    -- 2. Input validation
    IF p_client_code IS NULL OR TRIM(p_client_code) = '' THEN
        RAISE EXCEPTION 'Project code is required';
    END IF;

    -- 3. Role enforcement: Contractors cannot join any project as client
    IF is_contractor() THEN
        RAISE EXCEPTION 'Contractor cannot join project as client: Only client accounts can join projects';
    END IF;

    -- 4. Rate-limiting check for caller (auth.uid())
    SELECT * INTO v_attempt
    FROM project_code_attempts
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF FOUND THEN
        -- If locked and lockout window is still active
        IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > NOW() THEN
            RAISE EXCEPTION 'Too many failed project code attempts. Please try again in 15 minutes.';
        END IF;

        -- If lockout expired or sliding window (15 minutes) passed, reset window
        IF (v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until <= NOW()) OR
           (v_attempt.first_failed_at < NOW() - INTERVAL '15 minutes') THEN
            UPDATE project_code_attempts
            SET failed_attempts = 0,
                first_failed_at = NOW(),
                last_failed_at = NOW(),
                locked_until = NULL
            WHERE user_id = v_user_id;
        END IF;
    END IF;

    -- Clean code for matching (case-insensitive, normalize hyphens)
    v_clean_code := UPPER(TRIM(p_client_code));

    -- 5. Exclusive row lock lookup
    SELECT * INTO v_project
    FROM projects
    WHERE UPPER(TRIM(client_code)) = v_clean_code
       OR UPPER(REPLACE(client_code, '-', '')) = UPPER(REPLACE(v_clean_code, '-', ''))
    FOR UPDATE;

    -- 6. Evaluate failure conditions (uniform rejection without enumeration oracle)
    -- Condition A: Code not found in database
    -- Condition B: Code belongs to a project already claimed by another client
    -- Condition C: Code has expired for an unlinked project
    IF NOT FOUND OR
       (v_project.client_id IS NOT NULL AND v_project.client_id <> v_user_id) OR
       (v_project.client_id IS NULL AND v_project.code_expires_at IS NOT NULL AND v_project.code_expires_at < NOW()) THEN

        INSERT INTO project_code_attempts (user_id, failed_attempts, first_failed_at, last_failed_at, locked_until)
        VALUES (v_user_id, 1, NOW(), NOW(), NULL)
        ON CONFLICT (user_id) DO UPDATE
        SET failed_attempts = project_code_attempts.failed_attempts + 1,
            last_failed_at = NOW(),
            locked_until = CASE
                WHEN project_code_attempts.failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END;

        RETURN NULL;
    END IF;

    -- 7. If caller is already the linked client: return existing record safely and idempotently
    IF v_project.client_id = v_user_id THEN
        DELETE FROM project_code_attempts WHERE user_id = v_user_id;
        RETURN v_project;
    END IF;

    -- 8. Prevent contractor from joining their own project as a client
    IF v_project.contractor_id = v_user_id THEN
        RAISE EXCEPTION 'Contractor cannot join their own project as client';
    END IF;

    -- 9. Atomic Linking
    PERFORM set_config('servex.allow_client_linking', 'true', true);

    UPDATE projects
    SET client_id = v_user_id, updated_at = NOW()
    WHERE id = v_project.id
      AND (client_id IS NULL OR client_id = v_user_id)
    RETURNING * INTO v_project;

    IF NOT FOUND THEN
        INSERT INTO project_code_attempts (user_id, failed_attempts, first_failed_at, last_failed_at, locked_until)
        VALUES (v_user_id, 1, NOW(), NOW(), NULL)
        ON CONFLICT (user_id) DO UPDATE
        SET failed_attempts = project_code_attempts.failed_attempts + 1,
            last_failed_at = NOW(),
            locked_until = CASE
                WHEN project_code_attempts.failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
            END;

        RETURN NULL;
    END IF;

    -- 10. Success: Clear failed attempts
    DELETE FROM project_code_attempts WHERE user_id = v_user_id;

    RETURN v_project;
END;
$$;

REVOKE ALL ON FUNCTION join_project_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_project_by_code(TEXT) TO authenticated;

-- Secure Function for Contractor Code Rotation
CREATE OR REPLACE FUNCTION rotate_project_code(p_project_id TEXT, p_new_code TEXT)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_project projects%ROWTYPE;
    v_user_id UUID := auth.uid();
    v_clean_code TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_project_id IS NULL OR TRIM(p_project_id) = '' THEN
        RAISE EXCEPTION 'Project ID is required';
    END IF;

    IF p_new_code IS NULL OR LENGTH(TRIM(p_new_code)) < 8 THEN
        RAISE EXCEPTION 'New project code must be at least 8 characters';
    END IF;

    v_clean_code := UPPER(TRIM(p_new_code));

    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    IF v_project.contractor_id IS NULL OR v_project.contractor_id <> v_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Only the project contractor can rotate the project code';
    END IF;

    UPDATE projects
    SET client_code = v_clean_code,
        code_created_at = NOW(),
        code_expires_at = NOW() + INTERVAL '30 days',
        updated_at = NOW()
    WHERE id = p_project_id
    RETURNING * INTO v_project;

    RETURN v_project;
END;
$$;

REVOKE ALL ON FUNCTION rotate_project_code(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rotate_project_code(TEXT, TEXT) TO authenticated;

-- Database-level immutability guard: guarantees direct UPDATE cannot alter client_id
CREATE OR REPLACE FUNCTION check_project_client_id_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
        IF current_setting('servex.allow_client_linking', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'client_id cannot be modified via direct UPDATE. Use join_project_by_code flow.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_project_client_id_immutable ON projects;
CREATE TRIGGER trg_check_project_client_id_immutable
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION check_project_client_id_immutable();

-- 5. Scope Items Policies (Parent Project Anchor)
CREATE POLICY "scope_items_select_policy" ON scope_items
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = scope_items.project_id
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
    )
);

CREATE POLICY "scope_items_insert_policy" ON scope_items
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = scope_items.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "scope_items_update_policy" ON scope_items
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = scope_items.project_id
        AND p.contractor_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = scope_items.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "scope_items_delete_policy" ON scope_items
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = scope_items.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- 6. Workers Policies (Contractor Operational Record)
CREATE POLICY "workers_select_policy" ON workers
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = workers.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "workers_insert_policy" ON workers
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = workers.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "workers_update_policy" ON workers
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = workers.project_id
        AND p.contractor_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = workers.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "workers_delete_policy" ON workers
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = workers.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- 7. Attendance Records Policies (Contractor Operational Record - Clients Cannot Modify)
CREATE POLICY "attendance_records_select_policy" ON attendance_records
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = attendance_records.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "attendance_records_insert_policy" ON attendance_records
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = attendance_records.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "attendance_records_update_policy" ON attendance_records
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = attendance_records.project_id
        AND p.contractor_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = attendance_records.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "attendance_records_delete_policy" ON attendance_records
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = attendance_records.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- 8. Daily Work Reports Policies (Contractor Verified Inspection - Clients Cannot Modify)
CREATE POLICY "daily_work_reports_select_policy" ON daily_work_reports
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = daily_work_reports.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "daily_work_reports_insert_policy" ON daily_work_reports
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = daily_work_reports.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "daily_work_reports_update_policy" ON daily_work_reports
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = daily_work_reports.project_id
        AND p.contractor_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = daily_work_reports.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "daily_work_reports_delete_policy" ON daily_work_reports
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = daily_work_reports.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- 9. Ledger Transactions Policies (Contractor Financial Authority - Clients Cannot Modify)
-- Contractors can read all financial rows for their projects
CREATE POLICY "ledger_transactions_select_policy" ON ledger_transactions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- Clients may ONLY read client-facing received payments (RA billing).
-- Worker payouts (paid_to_worker) and worker wage liabilities are contractor-only.
CREATE POLICY "ledger_transactions_select_client_policy" ON ledger_transactions
FOR SELECT TO authenticated
USING (
    type = 'received_from_client'
    AND EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.client_id = (select auth.uid())
    )
);

CREATE POLICY "ledger_transactions_insert_policy" ON ledger_transactions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "ledger_transactions_update_policy" ON ledger_transactions
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.contractor_id = (select auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

CREATE POLICY "ledger_transactions_delete_policy" ON ledger_transactions
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- 10. Chat Messages Policies (Tri-Party & Worker Authority Enforcement)
CREATE POLICY "chat_messages_select_policy" ON chat_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = chat_messages.project_id
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
    )
);

-- Insert: Contractor can post as contractor/worker. Client can post ONLY as client (cannot execute authority actions).
CREATE POLICY "chat_messages_insert_policy" ON chat_messages
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = chat_messages.project_id
        AND (
            p.contractor_id = (select auth.uid())
            OR (
                p.client_id = (select auth.uid())
                AND chat_messages.sender_role = 'client'
                AND (chat_messages.is_authority_action IS NULL OR chat_messages.is_authority_action = false)
            )
        )
    )
);

CREATE POLICY "chat_messages_delete_policy" ON chat_messages
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = chat_messages.project_id
        AND p.contractor_id = (select auth.uid())
    )
);

-- ==============================================================================
-- 11. PHONE OTP CHALLENGES (Remediation 5: Server-Authoritative OTP Security)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS phone_otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(32) NOT NULL,
    country_code VARCHAR(16) NOT NULL DEFAULT '+91',
    otp_hmac TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    verified_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    verification_token TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_sent_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ
);

-- Indices for rapid lookup by phone, expiration, and verification token
CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone ON phone_otp_challenges (phone);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expires ON phone_otp_challenges (expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_token ON phone_otp_challenges (verification_token);

ALTER TABLE phone_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Explicitly DENY all direct access by clients (anon, authenticated, and public).
-- Direct reads/writes to OTP challenges and HMACs are strictly prohibited to prevent data leaks.
CREATE POLICY "otp_challenges_deny_select" ON phone_otp_challenges
FOR SELECT TO public
USING (false);

CREATE POLICY "otp_challenges_deny_insert" ON phone_otp_challenges
FOR INSERT TO public
WITH CHECK (false);

CREATE POLICY "otp_challenges_deny_update" ON phone_otp_challenges
FOR UPDATE TO public
USING (false)
WITH CHECK (false);

CREATE POLICY "otp_challenges_deny_delete" ON phone_otp_challenges
FOR DELETE TO public
USING (false);

REVOKE ALL ON TABLE phone_otp_challenges FROM PUBLIC, anon, authenticated;

-- record_otp_challenge: Server-authoritative function to record an OTP challenge with cooldown & abuse protection
CREATE OR REPLACE FUNCTION record_otp_challenge(
    p_phone TEXT,
    p_country_code TEXT DEFAULT '+91',
    p_otp_hmac TEXT DEFAULT '',
    p_cooldown_seconds INT DEFAULT 60,
    p_expiry_seconds INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_last_sent TIMESTAMPTZ;
    v_window_count INT;
    v_challenge_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    IF length(v_clean_phone) < 10 OR length(v_clean_phone) > 15 THEN
        RAISE EXCEPTION 'Invalid phone number length (must be between 10 and 15 digits)';
    END IF;

    IF p_otp_hmac IS NULL OR length(p_otp_hmac) < 16 THEN
        RAISE EXCEPTION 'Invalid OTP HMAC digest';
    END IF;

    -- 1. Resend cooldown enforcement (default 60 seconds)
    SELECT created_at INTO v_last_sent
    FROM phone_otp_challenges
    WHERE phone = v_clean_phone
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_sent IS NOT NULL AND NOW() < v_last_sent + (p_cooldown_seconds || ' seconds')::INTERVAL THEN
        RAISE EXCEPTION 'Resend cooldown active. Please wait % seconds before requesting another verification code.',
            CEIL(EXTRACT(EPOCH FROM (v_last_sent + (p_cooldown_seconds || ' seconds')::INTERVAL - NOW())));
    END IF;

    -- 2. Sliding-window abuse limit (maximum 5 requests per 15 minutes)
    SELECT COUNT(*) INTO v_window_count
    FROM phone_otp_challenges
    WHERE phone = v_clean_phone
      AND created_at > NOW() - INTERVAL '15 minutes';

    IF v_window_count >= 5 THEN
        RAISE EXCEPTION 'Too many verification attempts for this phone number. Please try again after 15 minutes.';
    END IF;

    -- 3. Invalidate any previous unverified challenges for this phone
    UPDATE phone_otp_challenges
    SET expires_at = NOW()
    WHERE phone = v_clean_phone
      AND verified_at IS NULL
      AND expires_at > NOW();

    -- 4. Create new challenge row
    v_expires_at := NOW() + (p_expiry_seconds || ' seconds')::INTERVAL;

    INSERT INTO phone_otp_challenges (
        phone,
        country_code,
        otp_hmac,
        expires_at,
        max_attempts,
        last_sent_at
    )
    VALUES (
        v_clean_phone,
        COALESCE(p_country_code, '+91'),
        p_otp_hmac,
        v_expires_at,
        5,
        NOW()
    )
    RETURNING id INTO v_challenge_id;

    RETURN jsonb_build_object(
        'success', true,
        'challenge_id', v_challenge_id,
        'expires_at', v_expires_at,
        'cooldown_seconds', p_cooldown_seconds
    );
END;
$$;

REVOKE ALL ON FUNCTION record_otp_challenge(TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_otp_challenge(TEXT, TEXT, TEXT, INT, INT) TO service_role;

-- verify_phone_otp: Server-authoritative function to verify an OTP against its HMAC with attempt tracking
CREATE OR REPLACE FUNCTION verify_phone_otp(
    p_challenge_id UUID,
    p_otp_hmac TEXT,
    p_expected_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_challenge RECORD;
    v_new_attempts INT;
    v_token TEXT;
    v_clean_expected TEXT;
BEGIN
    IF p_challenge_id IS NULL THEN
        RETURN jsonb_build_object('verified', false, 'error', 'Invalid verification challenge ID');
    END IF;

    -- Row-level lock to prevent concurrent verification race conditions
    SELECT * INTO v_challenge
    FROM phone_otp_challenges
    WHERE id = p_challenge_id
    FOR UPDATE;

    IF v_challenge IS NULL THEN
        RETURN jsonb_build_object('verified', false, 'error', 'Verification session not found or invalid');
    END IF;

    -- Identity binding: challenge cannot be switched to another phone
    IF p_expected_phone IS NOT NULL THEN
        v_clean_expected := regexp_replace(p_expected_phone, '\D', '', 'g');
        IF v_challenge.phone != v_clean_expected THEN
            RETURN jsonb_build_object('verified', false, 'error', 'Challenge identity mismatch: Invalid phone association');
        END IF;
    END IF;

    -- Check if challenge is already consumed
    IF v_challenge.consumed_at IS NOT NULL THEN
        RETURN jsonb_build_object('verified', false, 'error', 'Verification code already consumed');
    END IF;

    -- Check if challenge is locked (5 failed attempts)
    IF v_challenge.attempts >= v_challenge.max_attempts THEN
        RETURN jsonb_build_object('verified', false, 'error', 'Maximum verification attempts exceeded. Challenge locked.');
    END IF;

    -- Check expiration
    IF NOW() > v_challenge.expires_at THEN
        UPDATE phone_otp_challenges SET expires_at = NOW() WHERE id = p_challenge_id;
        RETURN jsonb_build_object('verified', false, 'error', 'Verification code has expired. Please request a new code.');
    END IF;

    -- Increment attempts
    v_new_attempts := v_challenge.attempts + 1;
    UPDATE phone_otp_challenges
    SET attempts = v_new_attempts
    WHERE id = p_challenge_id;

    -- If this failed attempt reaches max attempts, invalidate challenge and lock
    IF v_new_attempts >= v_challenge.max_attempts AND v_challenge.otp_hmac != p_otp_hmac THEN
        UPDATE phone_otp_challenges
        SET expires_at = NOW()
        WHERE id = p_challenge_id;
        RETURN jsonb_build_object('verified', false, 'error', 'Maximum verification attempts exceeded. Challenge locked.');
    END IF;

    -- Verify HMAC match
    IF v_challenge.otp_hmac = p_otp_hmac THEN
        v_token := encode(gen_random_bytes(32), 'hex');
        UPDATE phone_otp_challenges
        SET verified_at = NOW(),
            verification_token = v_token
        WHERE id = p_challenge_id;

        RETURN jsonb_build_object(
            'verified', true,
            'verification_token', v_token
        );
    ELSE
        RETURN jsonb_build_object(
            'verified', false,
            'attempts_remaining', (v_challenge.max_attempts - v_new_attempts),
            'error', 'Incorrect verification code. Please try again.'
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION verify_phone_otp(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_phone_otp(UUID, TEXT, TEXT) TO service_role;

-- verify_and_consume_phone_token: Atomically consumes verification token upon onboarding
CREATE OR REPLACE FUNCTION verify_and_consume_phone_token(
    p_phone TEXT,
    p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_challenge RECORD;
    v_clean_phone TEXT;
BEGIN
    IF p_phone IS NULL OR p_token IS NULL THEN
        RETURN FALSE;
    END IF;

    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

    SELECT * INTO v_challenge
    FROM public.phone_otp_challenges
    WHERE verification_token = p_token
      AND phone = v_clean_phone
    FOR UPDATE;

    IF v_challenge IS NULL THEN
        RETURN FALSE;
    END IF;

    IF v_challenge.consumed_at IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    IF v_challenge.verified_at IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Token expires after 1 hour
    IF NOW() > v_challenge.verified_at + INTERVAL '1 hour' THEN
        RETURN FALSE;
    END IF;

    UPDATE phone_otp_challenges
    SET consumed_at = NOW()
    WHERE id = v_challenge.id;

    RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION verify_and_consume_phone_token(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_and_consume_phone_token(TEXT, TEXT) TO authenticated;
