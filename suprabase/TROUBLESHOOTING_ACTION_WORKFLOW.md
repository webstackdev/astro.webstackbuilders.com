# Supabase GitHub Actions Troubleshooting

_Last updated: 2025-12-05_

## Current Failure Signature

- **Workflow:** `.github/workflows/test.yml` (E2E job) consistently fails before Playwright because Supabase migrations never create the required tables.
- **Symptoms:**
  - `supabase_migrations.schema_migrations` is missing each run, so we create it manually via `psql`.
  - `npx supabase migration up --local --workdir suprabase --debug` reports "Local database is up to date" immediately after querying `supabase_migrations.schema_migrations`, and does not emit any SQL.
  - Schema dump (`artifacts/supabase/schema.sql`) lacks `consent_records`, `newsletter_confirmations`, and `dsar_requests`; guard script confirms tables missing.
  - Table inventory from the Postgres container shows `Did not find any relation named "public.*"`, implying the CLI never runs migrations even though files exist.
- **Impact:** E2E suite cannot start (migrations guard exits 1), blocking cron and gated deployments.

## Last Four Days of Changes (files: workflows, `suprabase/**`, `package.json`)

| Date | Commit | Area | Summary |
| ---- | ------ | ---- | ------- |
| 2025-12-05 | `6d2abe6` | `suprabase/`, workflow | Migrated flat SQL files into timestamped folders so Supabase CLI can detect them; still seeing "up to date". |
| 2025-12-05 | `5e5c503` | test workflow | Added manual Docker pull with exponential backoff to dodge AWS ECR rate limits (`storage-api` image throttling). |
| 2025-12-05 | `4fa4135` | test workflow | Added catalog bootstrap step that creates `supabase_migrations.schema_migrations` via `psql` when missing. |
| 2025-12-05 | `2dc0150` | test workflow | Expanded migration logging (dir listings, schema dumps, table inventory) for observability. |
| 2025-12-05 | `9aed63a` | test workflow & `package.json` | Updated Supabase script to run `migration up` instead of `db push`; more verbose logging. |
| 2025-12-04 | `de6e1f9` | test workflow | Guard now talks to the actual Postgres container rather than the meta sidecar. |
| 2025-12-04 | `c263f13` | test workflow | Added schema dump artifacts and JSON migration status logging. |
| 2025-12-04 | `49dc3c8` | test workflow | Persisted Supabase schema log artifacts for later inspection. |
| 2025-12-04 | `7c864a2` | workflows & `package.json` | Swapped Ruby `dotenv` usage for Node CLI inside Actions; adjusted scripts accordingly. |
| 2025-12-04 | `cf9bb82` | workflows, package | Refactored workflows for clarity; added containers script to push migrations locally. |

_Older commits prior to four days introduced the `build-and-test.yml` predecessors and earlier `supabase db push` wiring; see `git log -- .github/workflows/build-and-test.yml` for context._

## Attempted Fixes (Chronological)

1. **Re-enabled CLI migrations inside Test workflow** (`cf9bb826`, Dec 4): ensured containers step existed, but migrations still skipped.
2. **Added extensive logging** (`bccc1e4c`, `c263f135`, `2dc0150f`): directory listings, schema dumps, JSON status, Postgres table inventory to capture evidence.
3. **Swapped dotenv & CLI invocation** (`7c864a2d`, `9aed63a7`): used Node-based `dotenv-cli` and later `npx supabase migration up` to mimic local behavior.
4. **Manual catalog bootstrap** (`4fa4135c`): created `supabase_migrations.schema_migrations` schema/table before CLI runs to avoid `42P01` errors observed earlier.
5. **Image throttling guard** (`5e5c5037`): pre-pulled `public.ecr.aws/supabase/storage-api:v1.32.1` with retries to prevent `toomanyrequests` failures during `supabase start`.
6. **Migration file restructuring** (`16855f89`, `6d2abe62`): moved migrations into timestamped directories with `migration.sql` to align with Supabase CLI expectations.
7. **Schema guard enforcement** (multiple commits): script ensures required tables exist; still failing with same missing tables.

## Working Theory

- The Supabase CLI appears to think the local project has already run every migration. Evidence: `migration up` immediately exits after reading an empty `schema_migrations` table we just created.
- Possible causes:
  - Supabase CLI caches migration state in `.branches/_current_branch` or `.temp/profile`; we delete these on each checkout so CLI may consider the project uninitialized and skip? (But logs show it reads zero rows then stops.)
  - Because `supabase start` spins up a fresh Postgres container every workflow run, migrations might require `supabase db reset` (which runs `db stop && db start && migration up`) rather than `migration up`. Without a shadow DB or `link`, CLI might decide there are no changes to apply.
  - The CLI expects a corresponding `supabase/migrations/meta` directory (created via `supabase migration new`). Our hand-made directories lack `migration.sql` metadata files (like `snapshot.sql`), so CLI ignores them even though the files exist.

## Suggested Next Steps (when time allows)

1. **Recreate migrations with CLI tooling**:
   - Run `supabase migration new <name>` locally to generate the folder structure with `migration.sql` + `snapshot.sql`. Copy the SQL into those files, commit, and verify `migration list` now shows pending versions.
2. **Try `supabase db reset --local --workdir suprabase`**:
   - This command runs all migrations against a clean database; use it instead of `migration up` to ensure tables get recreated each CI run.
3. **Preserve CLI metadata**:
   - Commit the `.branches` and `.temp` contents or generate them before calling `migration up`. The “open supabase/.temp/profile: no such file” message suggests the CLI aborts early when the profile is missing.
4. **Add diagnostic `supabase migration list --format json` before running migrations**:
   - Capture whether the CLI sees the new timestamped directories at all.
5. **Consider bypassing CLI**:
   - As a fallback, run `psql` against the container using the SQL files directly (e.g., `cat migrations/*/migration.sql | docker exec … psql`). This trades Supabase tooling for deterministic migrations but unblocks the suite while CLI issues are investigated.

Document whatever new data you collect here so the next debugging session has full context.
