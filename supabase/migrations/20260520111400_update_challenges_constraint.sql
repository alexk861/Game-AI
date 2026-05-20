-- Migration: Update challenges table set_order check constraint to support Multi-Reflection
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_set_order_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_set_order_check CHECK (set_order BETWEEN 1 AND 11);
