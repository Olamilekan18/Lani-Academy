-- Bank Transfer Metadata
-- Adds columns to the transactions table so learners can submit their
-- depositor name, source bank, transfer reference, and a receipt image/PDF
-- when paying via bank transfer.  Admins see this info before confirming.

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS depositor_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_bank TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_reference TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
