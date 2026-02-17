ALTER TABLE email_connections_imap
ENABLE ROW LEVEL SECURITY;

GRANT ALL ON email_connections_imap
TO service_role;

CREATE POLICY p1
ON email_connections_imap
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY p2
ON email_connections_imap
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY p3
ON email_connections_imap
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY p4
ON email_connections_imap
FOR DELETE
USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usersubs
ON user_subscriptions(user_id);
