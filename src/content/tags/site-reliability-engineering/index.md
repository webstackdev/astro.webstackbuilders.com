---
slug: "reliability-engineering"
displayName: "Reliability Engineering"
description: "TODO"
cover: "./cover.png"
coverAlt: "TODO"
featured: false
---

## GPT

__Reliability Engineering (SRE in practice)__

- SLIs/SLOs/error budgets (and how they fail in real systems)
- Incident response: triage, comms, mitigations, postmortems
- Resilience: load shedding, backpressure, circuit breakers
- Risk: safe deploy patterns and change management

### GPT Article Ideas

- Picking SLIs you can defend during an incident
- Error budgets as a tool, not a club
- Alert fatigue triage: reducing 200 alerts to 5 pages
- Backpressure patterns: keeping systems alive under load
- Retry storms: how they start, how to detect, how to stop

## Gemini

__SRE & Reliability__

Incident management, post-mortems, SLOs/SLIs, on-call health, and the cultural aspects of keeping systems running.

### Gemini Article Ideas

6. __"Incident Analysis: Moving Beyond 'Human Error'"__
   - _Concept:_ A practical guide to blameless post-mortems and finding systemic causes.
   - _Takeaway:_ "Human error" is a label, not a root cause.

7. __"Setting SLOs for Internal Services (That No One Cares About Yet)"__
   - _Concept:_ How to introduce SLOs to a team that has never measured availability.

8. __"On-Call Rotations for Small Teams: Survival Guide"__
   - _Concept:_ Managing burnout and alert fatigue when the rotation is only 3 people.

9. __"The Hidden Cost of 'Five Nines': When 99.9% is Good Enough"__
   - _Concept:_ Engineering tradeoffs between availability and velocity/cost.

10. __"Testing Failure Modes: Chaos Engineering on a Budget"__
    - _Concept:_ Simple scripts to kill pods or simulate latency without buying expensive tools.

## Opus

__Site Reliability Engineering__

On-call practices, incident response, post-mortems, SLO/SLI design, error budgets, and the organizational dynamics of keeping production healthy.

### Opus Article Ideas

7. __"Beyond 'Human Error': Systemic Incident Analysis"__
   - _Concept:_ Blameless post-mortems and finding contributing factors.
   - _Takeaway:_ Human error is where investigation begins, not ends.

8. __"SLOs for Internal Services Nobody Cares About"__
   - _Concept:_ Introducing reliability culture to teams without it.
   - _Takeaway:_ Start with what they already complain about.

9. __"On-Call for Teams of Three"__
   - _Concept:_ Sustainable rotations when you cannot staff 24/7.
   - _Takeaway:_ Escalation policies and alert quality matter more than headcount.

10. __"The Cost of Five Nines: When 99.9% is Enough"__
    - _Concept:_ Engineering and business tradeoffs of availability targets.
    - _Takeaway:_ Every nine costs 10x; know what you are buying.

11. __"Error Budgets in Practice: Spending and Saving"__
    - _Concept:_ Using error budgets to negotiate velocity vs. reliability.
    - _Takeaway:_ An unspent error budget is a missed opportunity.
