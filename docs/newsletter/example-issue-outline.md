## Sample Issue Outline

**Subject Line**: "The Kubernetes DNS Bug That Wasted 40 Engineering Hours"

### 1 - Deep Dive: Debugging ndots and Why Your DNS Is Slower Than You Think

Walk through a real scenario where the default Kubernetes `ndots:5` setting caused cascading DNS lookup failures under load. Cover the investigation process, the misleading metrics, the actual fix (adjusting ndots + adding search domain entries), and the monitoring changes that would have caught it earlier.

### 2 - Quick Wins

- **Terraform state backup**: A one-liner that snapshots your state file before every apply
- **Grafana dashboard hygiene**: A PromQL query to find dashboards nobody has viewed in 90 days
- **Git hook for secrets**: A pre-commit hook pattern using gitleaks that actually works with monorepos

### 3 - From the Blog

Highlight the latest article on structured logging with correlation IDs. Tie it back to the DNS debugging story (correlation IDs would have made the investigation faster).

### 4 - What We're Reading

- Cloudflare's post-mortem on their recent routing incident
- The OpenTelemetry Collector's new tail-sampling processor and what it means for costs
- A practical guide to SLO-based alerting from Google's SRE team

### 5 - One Thing to Try This Month

"Check your CoreDNS cache hit rate. If it's below 80%, you're probably hammering upstream resolvers unnecessarily. Here's the Prometheus query to check, and the CoreDNS Corefile change to fix it."