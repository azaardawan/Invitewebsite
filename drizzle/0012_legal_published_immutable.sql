-- A published policy version is what customers accepted: it may never change or disappear.
-- Drafts stay editable; publishing (DRAFT -> PUBLISHED) is the last allowed change.
CREATE OR REPLACE FUNCTION legal_policy_versions_freeze() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'published legal policy versions are immutable (% rejected)', TG_OP
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER legal_policy_versions_frozen
  BEFORE UPDATE OR DELETE ON legal_policy_versions
  FOR EACH ROW EXECUTE FUNCTION legal_policy_versions_freeze();
