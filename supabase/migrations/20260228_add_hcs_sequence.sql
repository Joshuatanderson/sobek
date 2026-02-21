-- Add hcs_sequence column to reputation_events for Hedera Consensus Service tracking.
-- Stores the topic sequence number returned after submitting each event to HCS.
ALTER TABLE reputation_events ADD COLUMN IF NOT EXISTS hcs_sequence bigint;
