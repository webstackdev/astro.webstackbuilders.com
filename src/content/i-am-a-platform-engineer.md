# Platform Engineering

DevOps with extra steps:

It’s about providing a full environment, process and automation, for developers to build, secure, and run their applications. DevOps builds specific pieces, Platform is the whole package.

I describe it as making internal devops products. I try to promote sound architecture, frequent deploys, data-driven ops and code as documentation into processes and opinionated tooling for our devs. I try to collect feedback and measure usage of those tools. Much like I would if I was selling a public SaaS.

platform eng as a team that provides holistic solutions including monitoring and alerting and uptime, working wtih eng teams to tune the solution apose to tayloring the solutions.

Example the platform eng team does everything in K8's, so when u build ur app make sure it runs on k8's.

platform team is providing an end to end solution to abstract away complexity in favor of a standardization (or "opinionated" is another term you see used). think Heroku

on the backend there's usually a plethora of tooling (usually need some homegrown solutions), CI/CD, versioning system, container orchestration, templating engine, IaC, monitoring / telemetry / instrumentation / logging (OTEL, DataDog, etc), alerting, etc. all this should be documented and available for developers to use in a self-service way. there should be zero need for any manual steps from your DevOps/tech ops/SRE/whatever team.

