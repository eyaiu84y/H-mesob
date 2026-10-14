-- Verify that INTERNAL was added to announcement_scope enum
SELECT unnest(enum_range(NULL::announcement_scope))::text AS scope_values;

-- Expected output should show all 5 values:
-- SYSTEM
-- INSTITUTION
-- ROLE
-- PUBLIC
-- INTERNAL
