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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant lookup by Client Code
CREATE INDEX IF NOT EXISTS idx_projects_client_code ON projects (client_code);

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
INSERT INTO projects (id, client_code, project_name, client_name, client_phone, site_address, start_date, status, worker_messaging_allowed)
VALUES 
('proj-1', 'CLT-8842', 'Skyline Penthouse Renovation', 'Vikramaditya Singhania', '+91 98201 12345', 'Flat 4201, Tower B, Worli Sea Face, Mumbai', '15 Sep 2026', 'active', true),
('proj-2', 'CLT-7721', 'Apex Tech Park HVAC Fitout', 'Pooja Hegde', '+91 98920 66778', 'Plot C-14, BKC G-Block, Bandra Kurla Complex, Mumbai', '01 Sep 2026', 'active', true),
('proj-3', 'CLT-9104', 'Bandra Retail Showroom Fitout', 'Karan Mehra', '+91 98333 77889', 'Ground Floor, Linking Road, Bandra West, Mumbai', '10 Oct 2026', 'upcoming', false)
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
