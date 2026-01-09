<!-- markdownlint-disable-file -->
# TODO

## E2E Files with Skipped Tests

Blocked Categories (44 tests):

Visual regression testing (18)

Playwright's Built-in Visual Testing

Playwright has a built-in visual comparison feature using await expect(page).toHaveScreenshot().

How it works: On the first run, Playwright saves a baseline screenshot. Subsequent runs compare the actual screenshot to this baseline, failing the test if there are pixel differences.

Pros: It's free, everything stays local (no third-party services needed), setup is simple, and you retain full control over the baseline images in your repository.

Cons: Browser rendering can be inconsistent across different operating systems and machines, leading to "flaky" tests or false positives. Managing baselines for multiple browsers and resolutions manually can also be challenging at scale.

Axe accessibility (2) - axe-core integration

## Search UI

- Move search box into header. Should be an icon like theme picker and hamburger menu, and spread out when clicked.
- On search results page, center results on page
- Improve indexing and how contents are returned.

## Performance

Implement mitigations in test/e2e/specs/07-performance/PERFORMANCE.md

## Email Templates

Right now we're using string literals to define HTML email templates for site mails. We should use Nunjucks with the rule-checking for valid CSS in HTML emails like we have in the corporate email footer repo.

## Chat bot tying into my phone and email

Vercel AI Gateway, maybe could use for a chatbot:

https://vercel.com/kevin-browns-projects-dd474f73/astro-webstackbuilders-com/ai-gateway


## Testimonials on mobile

We have E2E errors again testimonials slide on mobile chrome and safari. I think the problem is that we are pausing carousels when part of the carousel is outside of the viewport, and the testimonials are too large to display on mobile without being off viewport.

`test/e2e/specs/04-components/testimonials.spec.ts`:244:3 › Testimonials Component › @ready testimonials auto-rotate changes slide index

## Move containers to dev server from Playwright

We should start the mock containers with the dev server instead of with Playwright so that they're useable in a dev environment.

## Add Tooltip component

We need a Tooltip component. It should apply to the existing tooltips on the theme picker palettes.

## Improve print layout by hiding header and footer for articles, add tracking

```typescript
window.addEventListener('beforeprint', (event) => {
  console.log('Before print dialog opens, run this script.')
  // Example: change content or hide elements
  document.getElementById('hide-on-print').style.display = 'none'
})

window.addEventListener('afterprint', (event) => {
  console.log('After print dialog closes, run this script to revert changes.')
  // Example: revert changes
  document.getElementById('hide-on-print').style.display = ''
  // You can also use this event to send an AJAX request to a server for print tracking.
})
```

Or listen for changes:

```typescript
if (window.matchMedia) {
    var mediaQueryList = window.matchMedia('print');
    mediaQueryList.addListener(function(mql) {
        if (mql.matches) {
            // Equivalent to onbeforeprint
            console.log('Entering print mode (before print dialog)');
        } else {
            // Equivalent to onafterprint
            console.log('Exiting print mode (after print dialog)');
        }
    });
}
```

## E2E Test Errors

test/e2e/specs/14-regression/hero-animation-mobile-menu-pause.spec.ts

## Image generation models

- dall-e (OpenAI)
- flux pro - text-to-image and image-to-image generation, developed by Black Forest Labs, known for its exceptional speed, high visual quality, and superior prompt adherence, offering features like advanced editing, video generation, and context-aware understanding through platforms like Flux.ai, Fal.ai, and Skywork.ai. It serves as a professional-grade creative tool, balancing performance with user-friendly access for detailed content creation.
- nano banana (Google)
- sd3 (Stability AI's Stable Diffusion 3, open source)

## Content Instructions

- building-with-astro
- typescript-best-practices
- useful-vs-code-extensions
- writing-library-code

I want to generate detailed outlines in each of the MDX proposed articles we have in src/content/articles. Add the outline in the content section of the file. At the bottom of the file, add a "Cover Prompt" heading and add five detailed AI prompts to use with Flux Pro LLM to generate a cover image for the article. Each article should make use of the various components we have for MDX in src/content/articles/demo/index.mdx: Callouts, Grouped Code Tabs (if code examples in multiple programming languages make sense), otherwise single code examples in code fences (including highlights, insertions, and deletions in code examples), tables, footnotes, blockquotes with captions, lists, abbreviations, diagrams, charts, math examples, and images.

Make sure each article has multiple suggestions for including various components - especially code, diagrams, and charts. Include the suggestions in the outline along with detailed AI prompts to use in generating them, whether code, diagrams, or images.

1.  The output must be a detailed, multi-level outline using Markdown headings (H1, H2, H3).
2.  Start with a clear H1 title.
3.  Include an introduction, main body sections, and a conclusion.
4.  For each section (H2 and H3), provide a brief description (1-2 sentences) of the content it should contain and any specific examples or data points to include.
5.  Ensure the structure is logical for a technical audience and flows well.
6.  The final output should be ready to use, with no additional conversational text before or after the outline.

For context, You are a seasoned technical writer and content strategist with expertise in platform engineering. Your task is to generate a comprehensive, structured outline for a technical article. The outline should be detailed enough for another writer to produce the final content. I'll give you the article to outline one-by-one. The first is alert-fatigue-reduction-triage-actionable-alerts


api-deprecation-sunset-headers-consumer-migration
api-gateway-metrics-traces-logs-debugging
api-usage-metering-quotas-cost-attribution
api-versioning-deprecation-sunset-headers-migration
argocd-sync-failures-gitops-debugging-troubleshooting
availability-targets-five-nines-cost-benefit-analysis
backpressure-load-shedding-admission-control-overload
blameless-postmortem-incident-analysis-systemic-causes
blue-green-canary-deployment-strategy-comparison
cdn-edge-caching-cache-keys-vary-headers
chaos-engineering-failure-injection-low-cost-experiments
ci-pipeline-caching-docker-layers-dependency-cache
circuit-breaker-retry-budget-cascade-failure-prevention
consumer-driven-contract-testing-pact-internal-apis
container-vulnerability-scanning-ci-shift-left-security
contract-testing-consumer-driven-api-breaking-changes
database-schema-migrations-continuous-deployment-zero-downtime
dead-letter-queue-design-replay-debugging
deployment-rollback-state-dependencies-feature-flags
distributed-tracing-sampling-strategies-head-tail
eol-runtime-upgrade-dependency-hell-migration
ephemeral-preview-environments-cost-control-cleanup
error-budget-policy-slo-velocity-reliability-tradeoffs
event-schema-versioning-compatibility-evolution
flaky-test-diagnosis-race-conditions-e2e-stabilization
golden-paths-developer-experience-standardization-autonomy
grafana-dashboard-hygiene-pruning-actionable-metrics
graphql-federation-caching-challenges-vs-rest
helm-release-management-drift-detection-debugging
idempotent-message-handlers-deduplication-retries
internal-cli-kubectl-terraform-wrapper-abstraction
internal-developer-portal-platform-self-service-actions
internal-platform-api-versioning-deprecation-breaking-changes
kubernetes-cluster-upgrade-playbook-risk-reduction
kubernetes-cost-optimization-resource-sizing-spot-instances
kubernetes-decision-framework-when-not-to-use
kubernetes-dns-debugging-ndots-coredns-troubleshooting
kubernetes-hpa-autoscaling-metrics-tuning-latency
kubernetes-ingress-gateway-api-comparison-migration
kubernetes-multi-cluster-fleet-management-configuration
kubernetes-pod-disruption-budget-autoscaler-node-rotation
kubernetes-pod-resource-requests-limits-qos-classes
kubernetes-secrets-external-secrets-operator-csi-vault
legacy-code-testing-characterization-tests-seams
monorepo-affected-builds-remote-caching-ci-optimization
mtls-certificate-rotation-service-mesh-authentication
nginx-haproxy-reverse-proxy-production-tuning
on-call-rotation-small-teams-sustainable-coverage
opa-conftest-policy-as-code-infrastructure-guardrails
openapi-spec-documentation-sdk-generation-validation
opentelemetry-span-design-granularity-overhead
performance-testing-load-models-benchmark-accuracy
platform-architecture-control-plane-data-plane-separation
platform-engineering-metrics-lead-time-developer-friction
postgresql-connection-pooling-saturation-sizing
private-networking-dns-routing-tls-debugging
prometheus-high-cardinality-metrics-label-design
rate-limiting-token-bucket-leaky-bucket-implementation
release-quality-gates-automated-deployment-validation
retry-storm-prevention-exponential-backoff-jitter
reverse-engineering-documentation-legacy-systems
service-catalog-metadata-schema-ownership-tracking
service-decommissioning-scream-test-shutdown
sli-selection-user-centric-service-level-indicators
slo-adoption-internal-services-reliability-culture
slsa-build-provenance-artifact-signing-supply-chain
strangler-fig-migration-observability-traffic-shifting
strangler-fig-monolith-auth-extraction-migration
structured-logging-correlation-ids-log-schema-design
symptom-based-alerting-runbooks-alert-design
synthetic-test-data-pii-anonymization-fixtures
terraform-module-design-defaults-versioning-interfaces
terraform-state-locking-corruption-recovery-backend
workload-identity-federation-keyless-cloud-authentication
zero-downtime-database-migration-expand-contract
