-- A theme offers at most 3 packages at a time (1, 2 or 3). The service layer also
-- locks the theme row while changing packages; this trigger is the last line of defence.
CREATE OR REPLACE FUNCTION packages_enforce_max_active() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'ACTIVE' AND (
    SELECT count(*) FROM packages
    WHERE theme_id = NEW.theme_id AND status = 'ACTIVE' AND id <> NEW.id
  ) >= 3 THEN
    RAISE EXCEPTION 'a theme can have at most 3 active packages'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER packages_max_active
  BEFORE INSERT OR UPDATE OF status, theme_id ON packages
  FOR EACH ROW EXECUTE FUNCTION packages_enforce_max_active();
