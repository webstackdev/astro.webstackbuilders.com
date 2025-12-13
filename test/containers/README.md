# Test Containers

Astro DB now handles test data, so the only external services we need during e2e runs are the WireMock clones of ConvertKit and Resend. This folder keeps their mappings, payload fixtures, and a tiny docker-compose stack so local debugging matches CI.

## Services

- ConvertKit mock (`wiremock/wiremock`) responds to newsletter opt-in calls.
- Resend mock (`wiremock/wiremock`) queues transactional emails without leaving the network.

## Directory layout

```text
test/containers/
├── convertkit/                # WireMock mappings and payload fixtures
├── resend/                    # WireMock mappings for Resend endpoints
└── docker-compose.e2e.yml     # Compose stack for both mocks
```

## Prerequisites

1. Ensure Docker Desktop / Engine is running.
2. Create `test/containers/.env` with any custom port overrides. The defaults are:

   ```bash
   WIREMOCK_HOST=127.0.0.1
   CONVERTKIT_HTTP_PORT=9010
   RESEND_HTTP_PORT=9011
   ```

   `WIREMOCK_HOST` is consumed by both the docker-compose stack and the Astro API helpers, so override it if Docker binds the mocks to a different interface (for example, when running inside Lima or Colima).

## Usage

### Automatic (Playwright)

`npm run test:e2e` now invokes Playwright's global setup, which:

1. Resets the shared development Astro DB (`.astro/content.db`).
2. Runs `docker compose` against `docker-compose.e2e.yml` to boot the ConvertKit and Resend mocks.
3. Registers a teardown hook so the containers stop once the suite completes.

No additional feature flags or legacy secrets are required once the compose stack is running.

### Manual debugging

If you want to inspect WireMock responses outside the test harness, run the compose file directly:

```bash
docker compose --env-file test/containers/.env -f test/containers/docker-compose.e2e.yml up -d convertkit-mock resend-mock
# ... exercise the API ...
docker compose --env-file test/containers/.env -f test/containers/docker-compose.e2e.yml down
```

## Extending WireMock mappings

Add new JSON files under the appropriate `mappings/` folder and pair them with payloads inside `__files/`. WireMock's response templating is enabled, so you can echo pieces of the incoming request using helpers like `{{jsonPath request.body '$.field'}}`.

## CI integration

CI pipelines only need Docker available plus whatever secrets Resend/ConvertKit require. Running `npm run test:e2e` (or `npx playwright test`) automatically provisions the mocks and seeds Astro DB, so there are no bespoke sidecar steps to maintain.
