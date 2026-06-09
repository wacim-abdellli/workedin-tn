-- ============================================================================
-- Delivery Performance Indexes
-- Migration: 20260609010000_add_delivery_performance_indexes.sql
--
-- Adds composite indexes on contract_delivery_assets and contract_delivery_links
-- to speed up the RLS JOIN policies and per-delivery asset/link lookups.
-- Without these, every get_latest_contract_delivery() call does a full table
-- scan on these tables which will degrade at scale.
-- ============================================================================

-- Composite index: fast lookup by delivery + asset kind (used in get_latest_contract_delivery)
CREATE INDEX IF NOT EXISTS idx_delivery_assets_delivery_kind
    ON public.contract_delivery_assets(delivery_id, asset_kind, created_at ASC);

-- Composite index: fast lookup by delivery + link kind
CREATE INDEX IF NOT EXISTS idx_delivery_links_delivery_kind
    ON public.contract_delivery_links(delivery_id, link_kind, created_at ASC);

-- Index on access_state for efficient unlock queries in release_contract_payment_atomic
CREATE INDEX IF NOT EXISTS idx_delivery_assets_access_state
    ON public.contract_delivery_assets(access_state)
    WHERE access_state = 'locked';

-- Index on milestone deliveries for milestone-specific queries
CREATE INDEX IF NOT EXISTS idx_contract_deliveries_milestone_submitted
    ON public.contract_deliveries(milestone_id, version_number DESC)
    WHERE milestone_id IS NOT NULL;
