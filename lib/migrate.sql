-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free', -- free, pro
  rewrites_used INTEGER NOT NULL DEFAULT 0,
  rewrites_limit INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  original_title TEXT NOT NULL,
  original_body TEXT,
  rewritten_title TEXT NOT NULL,
  rewritten_body TEXT,
  subreddit TEXT NOT NULL,
  compliance_score INTEGER,
  changes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create subreddit_rules table
CREATE TABLE IF NOT EXISTS subreddit_rules (
  id TEXT PRIMARY KEY,
  subreddit TEXT NOT NULL UNIQUE,
  rules TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_subreddit ON posts(subreddit);
CREATE INDEX IF NOT EXISTS idx_subreddit_rules_subreddit ON subreddit_rules(subreddit);