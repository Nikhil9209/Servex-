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
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- ==============================================================================
-- INITIAL SEED DATA (Servex Skyline Penthouse & Apex Tech Park)
-- ==============================================================================
-- Note: contractor_id and client_id are explicitly NULL for pre-seeded projects.
-- Existing unmapped projects require controlled migration/linking when claimed by verified Supabase Auth accounts.
INSERT INTO projects (id, client_code, project_name, client_name, client_phone, site_address, start_date, status, worker_messaging_allowed, contractor_id, client_id)
VALUES 
('proj-1', 'CLT-8842', 'Skyline Penthouse Renovation', 'Vikramaditya Singhania', '+91 98201 12345', 'Flat 4201, Tower B, Worli Sea Face, Mumbai', '15 Sep 2026', 'active', true, NULL, NULL),
('proj-2', 'CLT-7721', 'Apex Tech Park HVAC Fitout', 'Pooja Hegde', '+91 98920 66778', 'Plot C-14, BKC G-Block, Bandra Kurla Complex, Mumbai', '01 Sep 2026', 'active', true, NULL, NULL),
('proj-3', 'CLT-9104', 'Bandra Retail Showroom Fitout', 'Karan Mehra', '+91 98333 77889', 'Ground Floor, Linking Road, Bandra West, Mumbai', '10 Oct 2026', 'upcoming', false, NULL, NULL)
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

-- 3. Projects Table Policies
-- SELECT: Authenticated contractor or linked client only
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT TO authenticated
USING (
    contractor_id = (select auth.uid())
    OR client_id = (select auth.uid())
);

-- INSERT: Contractor only; inserted contractor_id MUST match auth.uid()
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT TO authenticated
WITH CHECK (
    contractor_id = (select auth.uid())
    AND (client_id IS NULL OR client_id = (select auth.uid()))
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
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to join project';
    END IF;

    IF p_client_code IS NULL OR TRIM(p_client_code) = '' THEN
        RAISE EXCEPTION 'Project code is required';
    END IF;

    -- Lookup project strictly by unique client_code
    SELECT * INTO v_project
    FROM projects
    WHERE UPPER(TRIM(client_code)) = UPPER(TRIM(p_client_code));

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found with code %', p_client_code;
    END IF;

    -- If already linked to this client, return existing record
    IF v_project.client_id = v_user_id THEN
        RETURN v_project;
    END IF;

    -- Prevent claiming a project that is already linked to another client
    IF v_project.client_id IS NOT NULL AND v_project.client_id <> v_user_id THEN
        RAISE EXCEPTION 'This project is already linked to another client account';
    END IF;

    -- Mark transaction context as authorized client linking flow
    PERFORM set_config('servex.allow_client_linking', 'true', true);

    -- Securely link client_id to the caller's verified auth.uid()
    UPDATE projects
    SET client_id = v_user_id, updated_at = NOW()
    WHERE id = v_project.id
    RETURNING * INTO v_project;

    RETURN v_project;
END;
$$;

REVOKE ALL ON FUNCTION join_project_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_project_by_code(TEXT) TO authenticated;

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
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
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
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
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
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
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
CREATE POLICY "ledger_transactions_select_policy" ON ledger_transactions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ledger_transactions.project_id
        AND (p.contractor_id = (select auth.uid()) OR p.client_id = (select auth.uid()))
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
