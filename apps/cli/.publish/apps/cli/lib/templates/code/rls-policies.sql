-- Ultra-Dex Production Pattern: Row-Level Security Policies
-- Run after Prisma migrations to add RLS

-- =============================================================================
-- ENABLE RLS ON TABLES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get current user's clerk ID from session
CREATE OR REPLACE FUNCTION auth.clerk_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.clerk_id', true)::TEXT;
$$ LANGUAGE SQL STABLE;

-- Get current user's internal ID
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS TEXT AS $$
  SELECT id FROM users WHERE clerk_id = auth.clerk_id();
$$ LANGUAGE SQL STABLE;

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION auth.is_org_member(org_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = org_id
    AND u.clerk_id = auth.clerk_id()
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is admin of organization
CREATE OR REPLACE FUNCTION auth.is_org_admin(org_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = org_id
    AND u.clerk_id = auth.clerk_id()
    AND om.role IN ('OWNER', 'ADMIN')
  );
$$ LANGUAGE SQL STABLE;

-- =============================================================================
-- USERS POLICIES
-- =============================================================================

-- Users can read their own data
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (clerk_id = auth.clerk_id());

-- Users can update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (clerk_id = auth.clerk_id());

-- Admins can read all users
CREATE POLICY "users_select_admin" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.clerk_id = auth.clerk_id()
      AND u.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- =============================================================================

-- Members can view their organizations
CREATE POLICY "organizations_select_members" ON organizations
  FOR SELECT
  USING (auth.is_org_member(id));

-- Only admins can update organizations
CREATE POLICY "organizations_update_admin" ON organizations
  FOR UPDATE
  USING (auth.is_org_admin(id));

-- Only owners can delete organizations
CREATE POLICY "organizations_delete_owner" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = organizations.id
      AND u.clerk_id = auth.clerk_id()
      AND om.role = 'OWNER'
    )
  );

-- =============================================================================
-- ORGANIZATION MEMBERS POLICIES
-- =============================================================================

-- Members can view org membership
CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT
  USING (auth.is_org_member(organization_id));

-- Only admins can add/remove members
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT
  WITH CHECK (auth.is_org_admin(organization_id));

CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE
  USING (auth.is_org_admin(organization_id));

-- =============================================================================
-- PROJECTS POLICIES
-- =============================================================================

-- Members can view projects
CREATE POLICY "projects_select" ON projects
  FOR SELECT
  USING (auth.is_org_member(organization_id));

-- Members (non-viewers) can create projects
CREATE POLICY "projects_insert" ON projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = projects.organization_id
      AND u.clerk_id = auth.clerk_id()
      AND om.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
  );

-- Members can update projects they own, admins can update any
CREATE POLICY "projects_update" ON projects
  FOR UPDATE
  USING (
    (owner_id = auth.user_id()) OR auth.is_org_admin(organization_id)
  );

-- Only admins can delete projects
CREATE POLICY "projects_delete" ON projects
  FOR DELETE
  USING (auth.is_org_admin(organization_id));

-- =============================================================================
-- TASKS POLICIES
-- =============================================================================

-- Inherit from project access
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND auth.is_org_member(p.organization_id)
    )
  );

CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN organization_members om ON om.organization_id = p.organization_id
      JOIN users u ON u.id = om.user_id
      WHERE p.id = tasks.project_id
      AND u.clerk_id = auth.clerk_id()
      AND om.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
  );

CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND auth.is_org_member(p.organization_id)
    )
  );

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id
      AND auth.is_org_admin(p.organization_id)
    )
  );

-- =============================================================================
-- INVOICES POLICIES
-- =============================================================================

-- Only org admins can view invoices
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT
  USING (auth.is_org_admin(organization_id));

-- =============================================================================
-- ACTIVITY LOGS POLICIES
-- =============================================================================

-- Users can view their own activity
CREATE POLICY "activity_logs_select_own" ON activity_logs
  FOR SELECT
  USING (user_id = auth.user_id());

-- Admins can view all activity in their orgs
-- (would need to add org_id to activity_logs for this)

-- =============================================================================
-- USAGE: Set session context before queries
-- =============================================================================

/*
-- In your API routes or middleware, set the clerk_id:

-- For Prisma with raw queries:
await prisma.$executeRaw`SELECT set_config('app.clerk_id', ${clerkId}, true)`;

-- Then all subsequent queries will respect RLS policies

-- For Supabase:
const { data } = await supabase
  .from('projects')
  .select('*')
  // RLS automatically applied based on auth.uid()
*/
