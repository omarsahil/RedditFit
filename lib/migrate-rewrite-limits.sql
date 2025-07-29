-- Migration to update free users from 1 to 3 rewrites per day
-- Run this script to update existing users

-- Update all free users to have 3 rewrites limit instead of 1
UPDATE users 
SET rewrites_limit = 3, 
    updated_at = NOW() 
WHERE plan = 'free' AND rewrites_limit = 1;

-- Verify the update
SELECT plan, rewrites_limit, COUNT(*) as user_count 
FROM users 
GROUP BY plan, rewrites_limit; 