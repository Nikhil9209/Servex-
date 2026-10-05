-- ==============================================================================
-- SERVEX MIGRATION: 20261005_phase1_backend_correctness.sql
-- PHASE 1: BACKEND CORRECTNESS & DATA INTEGRITY EXTENSIONS (5 OCT 2026)
-- ==============================================================================

-- 1. Scope Items Over-Completion Constraints
ALTER TABLE scope_items
    DROP CONSTRAINT IF EXISTS chk_scope_completed_le_quantity,
    DROP CONSTRAINT IF EXISTS chk_scope_quantity_positive,
    DROP CONSTRAINT IF EXISTS chk_scope_completed_positive;

ALTER TABLE scope_items
    ADD CONSTRAINT chk_scope_completed_le_quantity CHECK (completed_quantity <= quantity),
    ADD CONSTRAINT chk_scope_quantity_positive CHECK (quantity >= 0),
    ADD CONSTRAINT chk_scope_completed_positive CHECK (completed_quantity >= 0);

-- 2. Ledger Transactions: Voiding & Audit Trail
ALTER TABLE ledger_transactions
    ADD COLUMN IF NOT EXISTS is_voided BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS void_reason TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ledger_transactions_voided ON ledger_transactions (project_id, is_voided);

-- 3. Projects Table: Archival Support
ALTER TABLE projects
    DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
    ADD CONSTRAINT projects_status_check CHECK (status IN ('active', 'upcoming', 'completed', 'archived')),
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 4. Atomic Daily Work Audit RPC
CREATE OR REPLACE FUNCTION submit_daily_work_audit(
    p_project_id TEXT,
    p_report_id TEXT,
    p_date TEXT,
    p_verified_by TEXT,
    p_items JSONB,
    p_total_work_value NUMERIC,
    p_total_worker_wage NUMERIC,
    p_contractor_margin NUMERIC
)
RETURNS daily_work_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_project projects%ROWTYPE;
    v_item RECORD;
    v_scope scope_items%ROWTYPE;
    v_qty_today NUMERIC;
    v_scope_id TEXT;
    v_result daily_work_reports%ROWTYPE;
BEGIN
    -- 1. Authentication requirement
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to submit daily work audit';
    END IF;

    -- 2. Validate project ownership (contractor only)
    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found: %', p_project_id;
    END IF;

    IF v_project.contractor_id IS NULL OR v_project.contractor_id <> v_uid THEN
        RAISE EXCEPTION 'Unauthorized: Only the project contractor can submit work verification audits';
    END IF;

    -- 3. Atomically validate and update each scope item with row lock
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        "scopeItemId" TEXT,
        "qtyDoneToday" NUMERIC
    )
    LOOP
        v_scope_id := v_item."scopeItemId";
        v_qty_today := COALESCE(v_item."qtyDoneToday", 0);

        IF v_qty_today < 0 THEN
            RAISE EXCEPTION 'Quantity done today cannot be negative: %', v_qty_today;
        END IF;

        IF v_qty_today > 0 THEN
            SELECT * INTO v_scope
            FROM scope_items
            WHERE id = v_scope_id AND project_id = p_project_id
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Scope item % not found in project %', v_scope_id, p_project_id;
            END IF;

            -- Enforce over-completion check atomically
            IF (v_scope.completed_quantity + v_qty_today) > v_scope.quantity THEN
                RAISE EXCEPTION 'Completed quantity would exceed agreed scope quantity for item "%" (max: %, current: %, adding: %)',
                    v_scope.name, v_scope.quantity, v_scope.completed_quantity, v_qty_today;
            END IF;

            UPDATE scope_items
            SET completed_quantity = completed_quantity + v_qty_today
            WHERE id = v_scope_id;
        END IF;
    END LOOP;

    -- 4. Insert audited daily report
    INSERT INTO daily_work_reports (
        id,
        project_id,
        date,
        verified_by,
        items_json,
        total_work_value_today,
        total_worker_wage_today,
        contractor_margin_today,
        is_verified
    )
    VALUES (
        p_report_id,
        p_project_id,
        p_date,
        p_verified_by,
        p_items,
        p_total_work_value,
        p_total_worker_wage,
        p_contractor_margin,
        TRUE
    )
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION submit_daily_work_audit(TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_daily_work_audit(TEXT, TEXT, TEXT, TEXT, JSONB, NUMERIC, NUMERIC, NUMERIC) TO authenticated;

-- 5. Stored Function: Void Ledger Transaction (Financial History Preservation)
CREATE OR REPLACE FUNCTION void_ledger_transaction(
    p_project_id TEXT,
    p_transaction_id TEXT,
    p_reason TEXT DEFAULT 'Voided by contractor'
)
RETURNS ledger_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_project projects%ROWTYPE;
    v_tx ledger_transactions%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    IF v_project.contractor_id IS NULL OR v_project.contractor_id <> v_uid THEN
        RAISE EXCEPTION 'Unauthorized: Only the project contractor can void transactions';
    END IF;

    SELECT * INTO v_tx
    FROM ledger_transactions
    WHERE id = p_transaction_id AND project_id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaction not found';
    END IF;

    IF COALESCE(v_tx.is_voided, false) THEN
        RAISE EXCEPTION 'Transaction is already voided';
    END IF;

    UPDATE ledger_transactions
    SET is_voided = TRUE,
        void_reason = COALESCE(p_reason, 'Voided by contractor'),
        voided_at = NOW()
    WHERE id = p_transaction_id
    RETURNING * INTO v_tx;

    RETURN v_tx;
END;
$$;

REVOKE ALL ON FUNCTION void_ledger_transaction(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION void_ledger_transaction(TEXT, TEXT, TEXT) TO authenticated;

-- 6. Server-Authoritative Financial Aggregates Function
CREATE OR REPLACE FUNCTION get_project_financial_summary(p_project_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_project projects%ROWTYPE;
    v_is_contractor BOOLEAN := FALSE;
    v_is_client BOOLEAN := FALSE;
    v_received NUMERIC := 0;
    v_wages NUMERIC := 0;
    v_net NUMERIC := 0;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    v_is_contractor := (v_project.contractor_id = v_uid);
    v_is_client := (v_project.client_id = v_uid);

    IF NOT (v_is_contractor OR v_is_client) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Aggregate client-facing received payments (unvoided)
    SELECT COALESCE(SUM(amount), 0) INTO v_received
    FROM ledger_transactions
    WHERE project_id = p_project_id
      AND type = 'received_from_client'
      AND COALESCE(is_voided, false) = false;

    -- If contractor: include worker wages & net balance
    IF v_is_contractor THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_wages
        FROM ledger_transactions
        WHERE project_id = p_project_id
          AND type = 'paid_to_worker'
          AND COALESCE(is_voided, false) = false;

        v_net := v_received - v_wages;

        RETURN jsonb_build_object(
            'project_id', p_project_id,
            'total_received', v_received,
            'total_wages_paid', v_wages,
            'net_balance', v_net,
            'is_restricted', false
        );
    ELSE
        -- Remediation 6: Client view strictly masks worker payouts & contractor margin
        RETURN jsonb_build_object(
            'project_id', p_project_id,
            'total_received', v_received,
            'total_wages_paid', 0,
            'net_balance', v_received,
            'is_restricted', true
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION get_project_financial_summary(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_project_financial_summary(TEXT) TO authenticated;

-- 7. Project Archival Function
CREATE OR REPLACE FUNCTION archive_project(p_project_id TEXT)
RETURNS projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_project projects%ROWTYPE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_project
    FROM projects
    WHERE id = p_project_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    IF v_project.contractor_id IS NULL OR v_project.contractor_id <> v_uid THEN
        RAISE EXCEPTION 'Unauthorized: Only the project contractor can archive the project';
    END IF;

    UPDATE projects
    SET status = 'archived',
        archived_at = NOW(),
        updated_at = NOW()
    WHERE id = p_project_id
    RETURNING * INTO v_project;

    RETURN v_project;
END;
$$;

REVOKE ALL ON FUNCTION archive_project(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION archive_project(TEXT) TO authenticated;

-- 8. Realtime Enablement for Projects
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN others THEN NULL;
END
$$;
