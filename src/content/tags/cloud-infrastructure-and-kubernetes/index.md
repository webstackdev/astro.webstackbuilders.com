---
slug: "cms"
displayName: "CMS"
description: "Content tagged with CMS."
cover: "./cover.png"
coverAlt: "CMS"
featured: false
---

## GPT

__Kubernetes and Runtime Engineering__

- Workload models: deployments vs statefulsets, jobs, cronjobs
- Networking: ingress, gateways, service mesh tradeoffs
- Scheduling: requests/limits, QoS classes, disruption budgets
- Operations: upgrades, node lifecycle, autoscaling behavior

### GPT Article Ideas

- Requests and limits deep dive: QoS classes and outage behavior
- Disruption budgets: surviving node rotations and autoscaler churn
- Autoscaling reality check: HPA signals, delays, and common traps
- Ingress vs Gateway API: choosing pragmatically
- Kubernetes upgrade playbook: making cluster upgrades boring

## Gemini

__Kubernetes & Cloud Infrastructure__

Hard technical guides on container orchestration, cloud-native patterns, infrastructure-as-code (Terraform/OpenTofu), and networking.

### Gemini Article Ideas

11. __"Multi-Cluster Strategy: Federation vs. Independence"__
    - _Concept:_ Managing configuration drift across dev, stage, and prod clusters.

12. __"Debugging DNS Latency in Kubernetes at Scale"__
    - _Concept:_ Deep dive into ndots, conntrack races, and CoreDNS tuning.

13. __"Right-Sizing Pod Resources: A Data-Driven Approach"__
    - _Concept:_ Using VPA recommendations and historical metrics to set limits/requests.

14. __"Secret Management Patterns: External Secrets Operator vs. CSI Driver"__
    - _Concept:_ Comparing modern ways to inject secrets into pods from Vault/AWS.

15. __"When NOT to Use Kubernetes: A Pragmatic Guide"__
    - _Concept:_ recognizing when a PaaS or rigid VM setup is actually better for the business.

## Opus

__Cloud Infrastructure & Kubernetes__

Container orchestration, multi-cluster patterns, networking deep dives, infrastructure-as-code (Terraform, OpenTofu, Pulumi), and cloud provider specifics.

### Opus Article Ideas

12. __"Multi-Cluster Kubernetes: Federation vs. Fleet Management"__
    - _Concept:_ Managing configuration across dev/stage/prod clusters.
    - _Takeaway:_ Consistency is harder than deployment.

13. __"DNS Debugging in Kubernetes: ndots, conntrack, and CoreDNS"__
    - _Concept:_ Deep dive into cluster DNS latency issues.
    - _Takeaway:_ DNS is always the problem until proven otherwise.

14. __"Pod Resource Sizing: VPA, Metrics, and Educated Guessing"__
    - _Concept:_ Data-driven approach to requests and limits.
    - _Takeaway:_ Under-provisioning wastes money; over-provisioning wastes availability.

15. __"Secrets in Kubernetes: ESO vs. CSI vs. Init Containers"__
    - _Concept:_ Comparing secret injection patterns from Vault/AWS.
    - _Takeaway:_ Each pattern has failure modes; pick yours intentionally.

16. __"When Kubernetes is Overkill: A Decision Framework"__
    - _Concept:_ Recognizing when simpler infrastructure wins.
    - _Takeaway:_ Complexity has carrying costs.

17. __"Terraform State: Locking, Backends, and Recovery"__
    - _Concept:_ State management patterns and disaster recovery.
    - _Takeaway:_ State corruption is a when, not if.
