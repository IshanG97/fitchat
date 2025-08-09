-- FitChat Database Wipe Script
-- This script removes all data from tables while preserving the table structure
-- Run this in your Supabase SQL editor

-- Disable foreign key constraints temporarily to avoid constraint violations
SET session_replication_role = replica;

-- Clear all data from tables (order matters due to foreign key relationships)
DELETE FROM tasks;
DELETE FROM messages;
DELETE FROM conversations;
DELETE FROM users;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset sequences to start from 1 again
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE conversations_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;

-- Verify tables are empty
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'conversations' as table_name, COUNT(*) as row_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as row_count FROM messages
UNION ALL
SELECT 'tasks' as table_name, COUNT(*) as row_count FROM tasks;