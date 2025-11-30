# Test Containers

End-to-end tests now rely on a deterministic set of local services. Everything needed to spin them up lives in this folder so CI and local developers share the same topology.

## Services

- ConvertKit mock (`wiremock/wiremock`) responds to newsletter opt-in calls.
- Resend mock (`wiremock/wiremock`) queues transactional emails without leaving the network.
- Upstash Redis local clone (`wb/upstash-redis-local`) is built from `test/containers/upstash/local-proxy/` and exposes REST + RESP interfaces backed by a dedicated `redis:7.4-alpine` container with deterministic seed data.
- Supabase (started via CLI) mirrors production database policies using the existing `suprabase/` project.

## Directory layout

```text
test/containers/
├── .env.example               # Ports + tokens for docker-compose
├── convertkit/                # WireMock mappings and payload fixtures
├── resend/                    # WireMock mappings for Resend endpoints
├── upstash/                   # Redis seed script + declarative seed files
├── supabase/                  # Helper scripts for running Supabase via CLI
├── scripts/                   # Shared shell helpers (health checks, waits, etc.)
└── docker-compose.e2e.yml     # Compose stack for mocks
```

## Prerequisites

1. Copy the example environment file and adjust ports/tokens if necessary:

   ```bash
   cp test/containers/.env.example test/containers/.env
   ```

2. Ensure Docker Desktop / Engine is running.
3. Install the Supabase CLI (`npm install --save-dev supabase` already supplies it locally).

## Usage

### 1. Start mock containers

```bash
source test/containers/.env
npm run containers:up
```

This command launches WireMock + Upstash services, applies Redis seeds, and exposes the ports declared in `.env`.

### 2. Wait for health checks (optional outside CI)

```bash
npm run containers:wait
```

The helper script (invoked through the npm alias) polls each HTTP endpoint until it responds or exits after the configured timeout.

### 3. Start Supabase (runs outside docker-compose)

```bash
npm run containers:supabase:start
```

The script reuses the existing `suprabase/` project directory, runs `npx supabase start`, and waits for the REST gateway to accept authenticated requests. Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env` if they differ from your local defaults.

### 4. Run the dev server + Playwright

With mocks running you can start the Astro dev server (in another terminal):

```bash
npm run dev
```

Then execute the Playwright suite with the mock flag enabled:

```bash
CI=1 FORCE_COLOR=1 E2E_MOCKS=1 npx playwright test
```

### 5. Tear everything down

```bash
npm run containers:down
npm run containers:supabase:stop
```

### 6. Inspect Supabase services (optional)

Check status or stream API logs without leaving npm:

```bash
npm run containers:supabase:status
npm run containers:supabase:logs
```

## Extending WireMock mappings

Add new JSON files under the appropriate `mappings/` folder and pair them with payloads inside `__files/`. WireMock's response templating is enabled, so you can echo pieces of the incoming request using helpers like `{{jsonPath request.body '$.field'}}`.

## Upstash seeding

Declarative seed files live in `upstash/seeds/*.json`. Supported `type` values:

- `queue` - pushes each `items[]` entry onto the named list.
- `hash` - sets fields under the named hash.
- `string` - sets a single string value.

The seeding container installs `jq` automatically and pipes commands through `redis-cli` once the Redis instance is healthy.

## CI integration

GitHub Actions can execute the same stack with:

```bash
docker buildx build --load -t wb/upstash-redis-local:test test/containers/upstash/local-proxy
npm run containers:up
npm run containers:wait
npm run containers:supabase:start
```

After tests conclude run `npm run containers:supabase:stop || true` and `npm run containers:down || true` (ideally inside an `if: always()` block) to guarantee cleanup.
