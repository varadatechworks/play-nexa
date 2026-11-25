-- Audit trail for in-person collection of pay-at-facility Shop orders.
-- Existing paid orders remain unchanged; these columns are populated for new collections.
ALTER TABLE commerce_orders
    ADD COLUMN counter_payment_method VARCHAR(20),
    ADD COLUMN payment_reference VARCHAR(120),
    ADD COLUMN payment_collected_by UUID REFERENCES users(id),
    ADD COLUMN payment_collected_at TIMESTAMPTZ;

ALTER TABLE commerce_orders
    ADD CONSTRAINT commerce_counter_payment_method_valid
    CHECK (counter_payment_method IS NULL OR counter_payment_method IN ('CASH', 'UPI', 'CARD'));

CREATE INDEX commerce_orders_payment_collected_idx
    ON commerce_orders(payment_collected_at DESC)
    WHERE payment_collected_at IS NOT NULL;
