-- ============================================================
-- Row-Level Security para isolamento multi-tenant
-- Cada query é automaticamente filtrada por org_id do utilizador autenticado.
-- ============================================================

-- Helper: devolve os org_ids a que o auth.uid() tem acesso (via memberships)
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM memberships WHERE user_id = auth.uid()
$$;

-- ============================================================
-- Ativar RLS em todas as tabelas com org_id
-- ============================================================
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;

-- Drop any prior policies (idempotent)
DROP POLICY IF EXISTS "members can read own org" ON organizations;
DROP POLICY IF EXISTS "owners/admins can update own org" ON organizations;
DROP POLICY IF EXISTS "members can read memberships of own org" ON memberships;
DROP POLICY IF EXISTS "owners/admins manage memberships" ON memberships;
DROP POLICY IF EXISTS "users read self" ON users;
DROP POLICY IF EXISTS "users update self" ON users;
DO $$
DECLARE tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['accounts','categories','suppliers','transactions','budgets','audit_log'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_read" ON %I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_write" ON %I', tbl, tbl);
  END LOOP;
END $$;

-- ============================================================
-- Policies: ORGANIZATIONS
-- ============================================================
CREATE POLICY "members can read own org"
  ON organizations FOR SELECT
  USING (id IN (SELECT public.user_org_ids()));

CREATE POLICY "owners/admins can update own org"
  ON organizations FOR UPDATE
  USING (id IN (
    SELECT org_id FROM memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================
-- Policies: MEMBERSHIPS
-- ============================================================
CREATE POLICY "members can read memberships of own org"
  ON memberships FOR SELECT
  USING (org_id IN (SELECT public.user_org_ids()));

CREATE POLICY "owners/admins manage memberships"
  ON memberships FOR ALL
  USING (org_id IN (
    SELECT org_id FROM memberships
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================
-- Policies: USERS (cada um vê o seu próprio perfil)
-- ============================================================
CREATE POLICY "users read self" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users update self" ON users FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- Policies: ACCOUNTS, CATEGORIES, SUPPLIERS, TRANSACTIONS, BUDGETS, AUDIT_LOG
-- (mesma lógica: filtrar por org_id; escrita só para roles operacionais)
-- Nota: role::text cast é necessário porque role é enum member_role
-- ============================================================
DO $$
DECLARE
  tbl text;
  read_roles text := 'owner,admin,operator,viewer,accountant';
  write_roles text := 'owner,admin,operator';
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['accounts','categories','suppliers','transactions','budgets','audit_log'])
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%s_read" ON %I FOR SELECT
      USING (org_id IN (
        SELECT org_id FROM memberships
        WHERE user_id = auth.uid() AND role::text = ANY(string_to_array('%s', ','))
      ))
    $f$, tbl, tbl, read_roles);

    EXECUTE format($f$
      CREATE POLICY "%s_write" ON %I FOR ALL
      USING (org_id IN (
        SELECT org_id FROM memberships
        WHERE user_id = auth.uid() AND role::text = ANY(string_to_array('%s', ','))
      ))
      WITH CHECK (org_id IN (
        SELECT org_id FROM memberships
        WHERE user_id = auth.uid() AND role::text = ANY(string_to_array('%s', ','))
      ))
    $f$, tbl, tbl, write_roles, write_roles);
  END LOOP;
END $$;

-- ============================================================
-- Trigger: criar registo em public.users quando alguém faz signup em auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
