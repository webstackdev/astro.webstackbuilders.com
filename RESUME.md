# Jordan Mitchell

**Senior Platform & DevOps Engineer** | Remote

jordan.mitchell@email.com · linkedin.com/in/jordanmitchell · github.com/jmitchell

---

## Summary

Platform engineer with five years of experience in cloud infrastructure, Kubernetes, observability, and developer experience. Specializes in migrating legacy systems to modern cloud-native architectures, building self-service platforms, and implementing security and compliance automation. Track record of measurable outcomes: 60–80% build time reductions, 70%+ MTTR improvements, and successful PCI-DSS, SOC2, and HIPAA certifications.

---

## Experience

### Senior Platform Engineer — Tegna

**Tysons, VA (Remote) · Aug 2025 – Present**

Media and broadcasting company with 120 engineers across 8 product teams, bottlenecked by a two-person platform team processing all AWS infrastructure requests.

- Built self-service infrastructure provisioning system using Terraform modules, OPA policy-as-code guardrails, and Atlantis PR-based workflows, reducing request lead time from two weeks to under one hour
- Designed five core Terraform modules (S3, RDS, Lambda, SQS, ElastiCache) covering 91% of all infrastructure requests, with security best practices (encryption, network isolation, audit logging) baked in
- Integrated Conftest with OPA policies enforcing SOC2 requirements in the CI pipeline, achieving zero policy violations while eliminating shadow IT resources discovered during initial audit
- Reduced platform team ticket volume by 75%, enabling them to shift from repetitive provisioning to high-value platform work; infrastructure spend dropped 12% despite increased provisioning volume

### Developer Experience Lead — Wolters Kluwer

**Philadelphia, PA (Remote) · Nov 2024 – Jun 2025**

Global information services company with 200+ engineers across 25 teams, struggling with fragmented documentation, unknown service ownership, and three-week onboarding cycles after years of acquisitions.

- Led implementation of Spotify's Backstage as the internal developer platform, achieving voluntary 100% service catalog adoption across all 340 services within six months without any organizational mandate
- Integrated TechDocs for in-repo Markdown documentation rendering, raising documentation coverage from 40% to 95% by eliminating the friction of separate documentation systems
- Built software scaffolder templates that reduced new service creation from two days to 30 minutes, with CI/CD, observability, and catalog registration pre-configured
- Developed custom Backstage plugins for deployment history, feature flags, incident management, and per-service cost visibility; cut new engineer onboarding from three weeks to four days

### Senior Backend Engineer — Moloco

**Redwood City, CA (Remote) · Jun 2024 – Sep 2024**

Machine learning adtech startup processing 500M+ daily events across 30+ services, suffering from cascade failures due to synchronous HTTP coupling and 24-hour analytics latency from batch processing.

- Migrated service communication from synchronous request/response to event-driven architecture using Apache Kafka (AWS MSK), eliminating cascade failures that had averaged 8 incidents per month
- Implemented Confluent Schema Registry with compatibility enforcement across 30+ services, preventing breaking changes during producer/consumer schema evolution
- Reduced analytics latency from 24 hours to under 5 seconds by replacing nightly batch jobs with real-time stream processing using ksqlDB, enabling real-time customer dashboards
- Executed three-phase migration (billing pilot → analytics events → operational events) with zero downtime, increasing system throughput 3x on the same infrastructure

### Senior Platform Engineer — Netsmart Technologies

**Overland Park, KS (Remote) · Aug 2023 – May 2024**

Healthcare technology company running 60+ microservices (Node.js, Python, Go) with fragmented observability across CloudWatch, Elasticsearch, Jaeger, and X-Ray, plus no formal HIPAA compliance program.

- Deployed unified observability stack with OpenTelemetry instrumentation and Grafana backends (Prometheus, Loki, Tempo), reducing mean time to detection from 4 hours to 8 minutes and MTTR from 6 hours to 45 minutes
- Built PHI redaction pipeline using OpenTelemetry Collector processors, enabling centralized logging while maintaining HIPAA compliance; passed audit with zero logging findings
- Saved $150K annually by replacing projected Datadog costs ($180K/yr) with self-hosted Grafana stack ($30K/yr in compute and storage) on existing Kubernetes infrastructure
- Automated 85% of HIPAA Security Rule controls using AWS Config rules, Terraform modules with compliant defaults, and CI/CD policy checks; reduced audit evidence collection from two weeks to two hours
- Achieved HIPAA certification one month ahead of deadline, directly enabling a $2M ARR enterprise contract with a regional hospital network

### Cloud Migration Lead — Estes Express Lines

**Richmond, VA (Remote) · Jan 2023 – Jun 2023**

Regional LTL freight carrier processing 50,000 daily shipments on 15-year-old on-premises infrastructure with an expiring data center lease and no cloud experience on the internal IT team.

- Led migration of 47 applications and 3 core databases from on-premises data center to AWS, completing two weeks ahead of the lease deadline with zero unplanned downtime during 24/7 operations
- Reverse-engineered undocumented carrier EDI integrations (FedEx, UPS, regional carriers) by capturing and analyzing network traffic, then rebuilt the integration layer using API Gateway with Lambda functions and AWS PrivateLink
- Reduced monthly infrastructure costs by 35% (from $89K to $58K) through right-sized instances, multi-AZ deployment, and elimination of the data center lease
- Improved system availability from 99.5% to 99.95% with multi-AZ failover; enabled real-time package tracking capabilities that launched within 60 days of migration completion
- Executed three-phase approach (non-critical systems → databases via DMS → core platform) that built team AWS competency before touching customer-facing systems

### Senior Cloud Engineer — Fidelity Investments

**Boston, MA (Hybrid) · Feb 2022 – Nov 2022**

Fortune 100 financial services firm operating 100+ microservices across hybrid on-premises/AWS environment, with PCI-DSS compliance requirements, sub-100ms P99 latency SLAs, and 10M+ daily payment transactions.

- Migrated 40+ microservices from EC2 to Amazon EKS while maintaining PCI-DSS compliance and sub-100ms latency; deployment frequency increased from bi-weekly to 15+ daily with 82% reduction in mean time to recovery
- Implemented zero trust architecture using Istio service mesh, achieving 100% mTLS encryption for all service-to-service traffic and replacing 200+ static firewall rules with SPIFFE identity-based authorization policies
- Deployed SPIRE for workload identity attestation with automatic hourly certificate rotation, reducing credential revocation time from hours to seconds; passed SOC2 Type II audit with zero network security findings
- Configured ArgoCD for GitOps-based deployments and Karpenter for node provisioning, reducing infrastructure costs by 30% through better bin-packing and automatic scaling; P99 latency improved from 85ms to 72ms
- Led four-phase rollout (permissive mesh → observability via Kiali → audit-mode policies → strict enforcement) that eliminated cascade failures without any production disruptions

### DevOps Engineer (Contract) — Overstock.com

**Midvale, UT (Remote) · Aug 2021 – Jan 2022**

E-commerce platform with 15 engineers and eight years of manual AWS console management across 847+ resources, suffering from configuration drift, two-week environment provisioning, and untracked incident response processes.

- Imported 847 AWS resources into Terraform using S3 remote state with DynamoDB locking, establishing version-controlled infrastructure after a prior Terraform attempt had failed due to state file corruption
- Set up Atlantis for PR-based infrastructure workflows with automatic `terraform plan` output on pull requests, eliminating direct console changes that had previously caused a production payment system outage
- Reduced new environment provisioning from two weeks to two hours; resolved production/staging configuration drift that had been causing unreproducible bugs
- Introduced structured incident management framework with severity levels, escalation paths, and an Incident Commander rotation, reducing mean time to resolution by 72% (from 90 to 25 minutes)
- Created runbook library for the top 20 recurring incident types, reducing on-call pages by 73% (from 15 to 4 per week) and enabling junior engineers to resolve incidents previously requiring senior escalation
- Established blameless postmortem process that reduced recurring incidents by 60% and eliminated on-call burden as a factor in engineer attrition

### Senior Platform Engineer — Braze

**New York, NY (Remote) · Nov 2020 – Jun 2021**

B2B SaaS customer engagement platform with 80 engineers in a TypeScript monorepo experiencing 45-minute CI builds, 30% flaky test failure rates, and $180K/month AWS spend growing faster than revenue.

- Redesigned monorepo CI/CD pipeline using Turborepo for incremental builds and parallelized test execution, reducing build times from 45 minutes to 8 minutes (82% improvement) and flaky test failures from 30% to under 2%
- Increased deployment frequency from twice weekly to multiple times daily by implementing dependency-aware build graphs that only rebuilt and tested affected packages on each pull request
- Led AWS cost optimization initiative that reduced monthly spend from $180K to $72K (60% reduction), saving $1.3M annually through instance right-sizing, reserved instance commitments, and unused resource cleanup
- Maintained 99.95% uptime and improved P99 latency during optimization by eliminating noisy neighbor effects through right-sized instances; savings extended company runway by eight months, preventing planned engineering layoffs

---

## Skills

**Cloud & Infrastructure:** AWS (EKS, EC2, RDS, S3, Lambda, MSK, DMS, API Gateway, PrivateLink, Config), Terraform, Atlantis, Karpenter, Kubernetes, Docker, Helm

**Observability & Reliability:** OpenTelemetry, Grafana (Prometheus, Loki, Tempo), Kiali, CloudWatch, Datadog, PagerDuty, incident management, runbooks, blameless postmortems

**CI/CD & Developer Experience:** ArgoCD, GitHub Actions, Turborepo, Backstage (Spotify), TechDocs, software scaffolding, monorepo tooling

**Security & Compliance:** Istio, mTLS, SPIFFE/SPIRE, OPA/Conftest, PCI-DSS, SOC2 Type II, HIPAA, zero trust architecture

**Event Streaming:** Apache Kafka (MSK), Confluent Schema Registry, ksqlDB, event-driven architecture

**Languages:** TypeScript, Python, Go, HCL, Rego, Bash

---

## Education

**B.S. Computer Science** — Virginia Tech, Blacksburg, VA · 2016
