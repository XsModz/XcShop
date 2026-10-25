-- XcShop database schema
-- All IDs are BIGINT for Telegram compatibility.
-- All timestamps are TIMESTAMPTZ.
-- Instance-scoped tables include instance_id in multi-instance deployments.

CREATE TABLE instances (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bot_token_encrypted TEXT NOT NULL,
  admin_id BIGINT NOT NULL,
  storage_chat_id BIGINT NOT NULL,
  support_username TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT instances_name_unique UNIQUE (name)
);

COMMENT ON TABLE instances IS 'Bot instance configuration. Each logical shop can have its own Telegram bot token and storage chat.';
COMMENT ON COLUMN instances.bot_token_encrypted IS 'Encrypted bot token serialized as JSON from lib/crypto.js.';
COMMENT ON COLUMN instances.admin_id IS 'Telegram user ID of the instance owner/admin.';
COMMENT ON COLUMN instances.storage_chat_id IS 'Private storage chat where source media files are copied for distribution.';
COMMENT ON COLUMN instances.support_username IS 'Username without @ used by the support action.';
COMMENT ON COLUMN instances.webhook_secret IS 'Shared secret used to validate Telegram webhook requests.';
COMMENT ON COLUMN instances.is_active IS 'Whether this instance is active for routing and operations.';

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  first_name TEXT NOT NULL,
  username TEXT,
  language_code TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  vip_until TIMESTAMPTZ,
  is_vip_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_instance_telegram_unique UNIQUE (instance_id, telegram_id)
);

COMMENT ON TABLE users IS 'Registered Telegram users scoped to an instance.';
COMMENT ON COLUMN users.telegram_id IS 'Telegram user ID from the message sender.';
COMMENT ON COLUMN users.first_name IS 'Telegram first_name value, escaped before display in the bot.';
COMMENT ON COLUMN users.username IS 'Optional Telegram username without @ for display or support links.';
COMMENT ON COLUMN users.is_blocked IS 'Whether the user is blocked from all bot interactions.';
COMMENT ON COLUMN users.vip_until IS 'When timed VIP expires; NULL means no timed VIP.';
COMMENT ON COLUMN users.is_vip_lifetime IS 'Dedicated lifetime VIP flag. Must be checked on every protected action.';
COMMENT ON COLUMN users.updated_at IS 'Last profile or state update timestamp.';

CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_instance_name_unique UNIQUE (instance_id, name)
);

COMMENT ON TABLE categories IS 'File categories for browsing and organization within an instance.';
COMMENT ON COLUMN categories.name IS 'Display name of the category.';
COMMENT ON COLUMN categories.is_hidden IS 'Hidden categories are not shown in public browsing.';
COMMENT ON COLUMN categories.updated_at IS 'Last category modification time.';

CREATE TABLE files (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'vip')),
  storage_message_id BIGINT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT files_instance_storage_unique UNIQUE (instance_id, storage_message_id)
);

COMMENT ON TABLE files IS 'Distributed files available in Telegram via storage chat copyMessage.';
COMMENT ON COLUMN files.category_id IS 'Category id, nullable only when a category is re-assigned or deleted.';
COMMENT ON COLUMN files.title IS 'Public title shown to users in the bot.';
COMMENT ON COLUMN files.description IS 'Optional description shown in the file list.';
COMMENT ON COLUMN files.tier IS 'Access tier: free or vip.';
COMMENT ON COLUMN files.storage_message_id IS 'Telegram message_id of the copy stored in the storage chat.';
COMMENT ON COLUMN files.is_hidden IS 'Hidden files are excluded from public display.';
COMMENT ON COLUMN files.created_by IS 'User id of the admin who uploaded the file.';
COMMENT ON COLUMN files.updated_at IS 'Last change to file metadata or visibility.';

CREATE TABLE file_grants (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL CHECK (grant_type IN ('vip', 'key', 'manual')),
  granted_by BIGINT REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT file_grants_unique UNIQUE (instance_id, user_id, file_id, grant_type)
);

COMMENT ON TABLE file_grants IS 'Explicit grants to a user for a specific file. Used for one-off file access and auditability.';
COMMENT ON COLUMN file_grants.grant_type IS 'Type of grant: vip, key, or manual.';
COMMENT ON COLUMN file_grants.expires_at IS 'Optional expiration for a specific file grant.';

CREATE TABLE keys (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  key_string TEXT NOT NULL,
  key_type TEXT NOT NULL CHECK (key_type IN ('VIP_1D', 'VIP_7D', 'VIP_30D', 'VIP_LIFE', 'FILE_ID')),
  target_file_id BIGINT REFERENCES files(id) ON DELETE SET NULL,
  created_by BIGINT NOT NULL REFERENCES users(id),
  redeemed_by BIGINT REFERENCES users(id),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  use_count INTEGER NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT keys_instance_string_unique UNIQUE (instance_id, key_string),
  CONSTRAINT keys_target_file_required CHECK (
    (key_type = 'FILE_ID' AND target_file_id IS NOT NULL) OR (key_type <> 'FILE_ID')
  )
);

COMMENT ON TABLE keys IS 'Redeemable access keys. Supports VIP grants and single-file file access.';
COMMENT ON COLUMN keys.key_string IS 'Cryptographically random URL-safe key string used for redemption.';
COMMENT ON COLUMN keys.key_type IS 'VIP_1D, VIP_7D, VIP_30D, VIP_LIFE, or FILE_ID.';
COMMENT ON COLUMN keys.target_file_id IS 'Target file when the key grants access to a single file.';
COMMENT ON COLUMN keys.created_by IS 'User who generated the key, usually admin or reseller.';
COMMENT ON COLUMN keys.redeemed_by IS 'User who redeemed the key, if any.';
COMMENT ON COLUMN keys.redeemed_at IS 'Time the key was redeemed by the first qualifying user.';
COMMENT ON COLUMN keys.expires_at IS 'Expiration time for the key itself if created as a time-limited key.';
COMMENT ON COLUMN keys.max_uses IS 'Maximum number of times the key may be redeemed.';
COMMENT ON COLUMN keys.use_count IS 'Number of times the key has been used.';
COMMENT ON COLUMN keys.is_active IS 'Whether the key is active and eligible for redemption.';
COMMENT ON COLUMN keys.updated_at IS 'Last update to key state or metadata.';

CREATE TABLE resellers (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  allowed_key_types TEXT[] NOT NULL DEFAULT '{}',
  key_quota INTEGER NOT NULL DEFAULT 0 CHECK (key_quota >= 0),
  keys_used INTEGER NOT NULL DEFAULT 0 CHECK (keys_used >= 0),
  quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT NOT NULL REFERENCES users(id),
  CONSTRAINT resellers_instance_user_unique UNIQUE (instance_id, user_id)
);

COMMENT ON TABLE resellers IS 'Reseller configuration controlling key generation permissions and quota.';
COMMENT ON COLUMN resellers.user_id IS 'Telegram user id of the reseller.';
COMMENT ON COLUMN resellers.label IS 'Display label shown to admins for reseller identification.';
COMMENT ON COLUMN resellers.allowed_key_types IS 'Allowed key generation types, e.g. {VIP_7D,VIP_30D}.';
COMMENT ON COLUMN resellers.key_quota IS 'Maximum number of active keys a reseller may retain at once.';
COMMENT ON COLUMN resellers.keys_used IS 'Current count from the active quota cycle.';
COMMENT ON COLUMN resellers.quota_reset_at IS 'When the quota cycle resets.';
COMMENT ON COLUMN resellers.is_active IS 'Whether the reseller is active and can access the reseller panel.';
COMMENT ON COLUMN resellers.created_by IS 'Admin who assigned the reseller role.';

CREATE TABLE reseller_log (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reseller_log IS 'Audit log for all reseller actions and quota changes.';
COMMENT ON COLUMN reseller_log.action IS 'Human-readable description of the reseller action.';
COMMENT ON COLUMN reseller_log.details IS 'Structured details about the action for auditing and debugging.';

CREATE TABLE processed_updates (
  id BIGSERIAL PRIMARY KEY,
  instance_id BIGINT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
  update_id BIGINT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT processed_updates_instance_update_unique UNIQUE (instance_id, update_id)
);

COMMENT ON TABLE processed_updates IS 'Deduplication table for incoming Telegram updates to prevent re-processing.';
COMMENT ON COLUMN processed_updates.update_id IS 'Telegram update_id value as received from the webhook payload.';
COMMENT ON COLUMN processed_updates.processed_at IS 'When the update was processed.';

CREATE INDEX idx_users_instance_active
  ON users (instance_id, is_blocked, vip_until);

CREATE INDEX idx_categories_instance_visibility
  ON categories (instance_id, is_hidden);

CREATE INDEX idx_files_instance_tier_visibility
  ON files (instance_id, tier, is_hidden, category_id);

CREATE INDEX idx_file_grants_user_file
  ON file_grants (instance_id, user_id, file_id);

CREATE INDEX idx_keys_instance_active
  ON keys (instance_id, is_active, expires_at, key_type);

CREATE INDEX idx_keys_redeemed_by
  ON keys (instance_id, redeemed_by);

CREATE INDEX idx_resellers_instance_active
  ON resellers (instance_id, is_active);

CREATE INDEX idx_reseller_log_instance_user
  ON reseller_log (instance_id, user_id, created_at);

CREATE INDEX idx_processed_updates_instance
  ON processed_updates (instance_id, processed_at);
