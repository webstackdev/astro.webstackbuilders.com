# The Kubernetes DNS Bug That Wasted 40 Engineering Hours

*Monthly dispatch from Webstack Builders — platform engineering, DevOps, and cloud infrastructure*

---

## The Deep Dive — Debugging ndots and Why Your DNS Is Slower Than You Think

Three weeks ago, a client's platform team started seeing intermittent 5xx errors from a handful of microservices. Latency percentiles looked normal. CPU and memory were fine. The on-call engineer checked the usual suspects — upstream dependencies, recent deploys, connection pool exhaustion — and found nothing.

Forty engineering hours later, the root cause turned out to be DNS.

**The symptoms were misleading.** Under moderate load, roughly 2% of HTTP requests to internal services would time out. The timeouts were evenly distributed across services, which made it look like a network issue rather than a resolution issue. The team spent a full day chasing a phantom connectivity problem between nodes before someone finally ran `tcpdump` on a pod's network namespace and noticed something odd: every single DNS lookup was generating five queries instead of one.

**The culprit: `ndots:5`.** Kubernetes sets `ndots:5` in every pod's `/etc/resolv.conf` by default. This means that any hostname with fewer than five dots gets treated as a relative name, and the resolver appends each search domain before trying the name as-is. A lookup for `auth-service.production.svc.cluster.local` (four dots) would first try `auth-service.production.svc.cluster.local.production.svc.cluster.local`, then three more permutations, before finally resolving correctly on the fifth attempt.

Under normal load, this is invisible. Under sustained traffic, it was multiplying DNS query volume by 5x and saturating CoreDNS pods that were sized for the expected query rate — not five times the expected query rate.

**What made this hard to find.** The standard CoreDNS metrics — `coredns_dns_requests_total` and `coredns_dns_responses_total` — were elevated but didn't trigger alerts because the team's thresholds were based on historical averages that had gradually crept up. The metrics told the truth; nobody was looking at the right graph.

**The fix was two lines.** In the pod spec's `dnsConfig`:

```yaml
dnsConfig:
  options:
    - name: ndots
      value: "2"
```

This tells the resolver to treat any name with two or more dots as fully qualified, skipping the search domain dance. For internal service names that use the full `<service>.<namespace>.svc.cluster.local` format, this eliminates four unnecessary queries per lookup.

The team also added explicit search domain entries to avoid breaking short names used in legacy configuration:

```yaml
dnsConfig:
  searches:
    - production.svc.cluster.local
    - svc.cluster.local
```

**What should have caught this earlier.** Two monitoring changes went in immediately after the fix:

- A Prometheus alert on `coredns_dns_requests_total` rate-of-change, not just absolute value. A 5x query spike in an hour is never normal.
- A dashboard panel showing cache hit ratio alongside query volume. During the incident, cache hit rate had dropped to 31% — a clear signal that pods were hammering CoreDNS with queries that could never be cached because they were for nonexistent names.

The takeaway isn't "change your ndots setting." It's that default configurations optimized for convenience can become performance landmines at scale, and the monitoring that catches them is rarely the monitoring you set up on day one.

---

## Quick Wins

- **Terraform state backup before every apply.** Add this to your CI pipeline or local workflow. One line, zero regret when someone applies against the wrong workspace:

  ```bash
  terraform state pull > "tfstate-backup-$(date +%Y%m%d-%H%M%S).json" && terraform apply
  ```

- **Find abandoned Grafana dashboards.** This PromQL query surfaces dashboards with zero views in the last 90 days. Clean them out before your Grafana instance becomes a graveyard of dashboards nobody trusts:

  ```text
  grafana_db_dashboard_last_viewed_at < (time() - 86400 * 90)
  ```

  Run it against your Grafana metrics endpoint, or use the Grafana API: `GET /api/search?query=&sort=viewed-asc` and filter by `meta.lastViewedAt`.

- **Pre-commit secrets scanning that works with monorepos.** Most `gitleaks` setups choke on monorepos because they scan the entire history on every commit. This `.pre-commit-config.yaml` entry scans only staged changes:

  ```yaml
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
        args: ["protect", "--staged"]
  ```

---

## From the Blog

Our latest article covers **structured logging with correlation IDs** — how to thread a single request identifier through every service in a call chain so that debugging distributed failures doesn't require cross-referencing timestamps across six different log streams.

If that DNS investigation above had used correlation IDs, the team could have traced a single failing request from the API gateway through to the DNS timeout in minutes instead of hours. The post walks through implementation patterns for Node.js and Go services, with examples using OpenTelemetry's trace context propagation.

[Read the full article →](#)

---

## What I'm Reading

- **Cloudflare's routing incident post-mortem** — A BGP misconfiguration took down a significant chunk of their network for 17 minutes. The post-mortem is worth reading for the timeline alone: how a change that passed validation in staging behaved differently in production because of a subtle difference in route map evaluation order. [Read it →](#)

- **OpenTelemetry Collector tail-sampling processor** — The new tail-sampling processor lets you make sampling decisions after a trace is complete, which means you can keep 100% of error traces and slow traces while sampling routine ones aggressively. If you're spending too much on trace storage, this is the feature to evaluate. [Read it →](#)

- **Google SRE: A practical guide to SLO-based alerting** — Moves past the theory and into implementation. The section on multi-window, multi-burn-rate alerts is the clearest explanation of the concept available. If your alerts still fire on static thresholds, start here. [Read it →](#)

---

## One Thing to Try This Month

Check your CoreDNS cache hit rate. If it's below 80%, you're probably hammering upstream resolvers unnecessarily — and you might be one traffic spike away from the exact scenario described in this issue's deep dive.

Here's the Prometheus query:

```text
sum(rate(coredns_cache_hits_total[5m])) /
(sum(rate(coredns_cache_hits_total[5m])) + sum(rate(coredns_cache_misses_total[5m])))
```

If the number is low, two things to check: your `ndots` setting (see above) and your CoreDNS Corefile's cache TTL. The default cache block caches positive responses for 30 seconds, which is usually too short for internal service names that rarely change. Bumping it to 300 seconds is safe for most clusters:

```text
cache 300
```

Add that line to the `Corefile` ConfigMap and roll the CoreDNS pods. Measure again the next day.

---

*Webstack Builders, Inc. — You're receiving this because you subscribed at webstackbuilders.com.*

