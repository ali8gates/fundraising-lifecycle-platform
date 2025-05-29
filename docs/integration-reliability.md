# Integration reliability against a donor CRM

This is the part of the work I would want to be asked about. Everything the platform does depends on
records arriving correctly from a donor CRM I did not control, in environments configured by other
people, on a release schedule that was not mine.

The systems in scope were Blackbaud Raiser's Edge NXT and Blackbaud CRM on the donor side, and
Salesforce on the organization's own side. The specific vendor matters less than the shape of the
problem, which repeats everywhere: a source system with a data model built for a different purpose,
one deployment per institution, and no ability to change either.

## The mistake I did not want to make

The first instinct is to treat this as an API reliability problem. Add retries, add a queue, add a
dead letter, ship it. That instinct is wrong here, and it is wrong in a way that costs a quarter,
because most of the failures are not transport failures. The payload arrives. It is just ambiguous,
or shaped differently than the last institution, or complete in one direction and empty in the other.

So the first question I asked was not "how do we make the sync more reliable." It was "what exactly
is failing, per direction, per environment, per record type." That question is answerable with counts,
and until you have those counts every fix is a guess.

## Failure catalogue

Four distinct failures that all present as "the integration is broken."

### 1. Ambiguous identity

A constituent profile can require a child's school name and an email address. When that record flows
outward, there is no reliable field that says whether the person described is the adult in the
household or the child. Two different people, one record shape.

Downstream this is not a cosmetic problem. It decides:

- whether an ask is legal and appropriate to send at all
- whether a gift gets soft credited to the right household member
- whether a duplicate gets created on the next sync
- whether a person receives mail addressed to a minor

The wrong answer is to pick a default. A default produces confident, silent errors, and the fundraising
team loses trust in the whole system the first time one surfaces in front of a donor.

What I did instead, in `packages/shared/src/crm/household.ts`:

- Resolve the role with ordered signals, each individually testable. Explicit age or birth date first.
  Then an explicit relationship field where the environment has one. Then salutation and title. Then
  the email local part and domain, since a school issued address and a parent style address carry real
  information. Then class year against the current year. Then presence of employer or spouse fields.
  Then address sharing with a record already resolved as an adult.
- Return a role, a confidence value, and the list of reasons that produced it. The reasons are the
  part support actually uses.
- Below a configurable confidence floor, return unresolved. An unresolved record goes to a review
  queue. It is never written through to a system of record.

The review queue was not a fallback I added late. It was the concession that made the CRM team
willing to let the platform participate in the data flow at all.

### 2. Environment variance

The same vendor product behaves differently per institution. Different edition, different age of
edition, hosted or not, custom fields renamed by whoever configured it years ago, optional modules
present or absent. A fix that works at one institution is not a fix, it is an anecdote.

The answer is configuration, not branching:

- `packages/shared/src/crm/mapping.ts` holds mapping profiles keyed by system and environment variant.
  A profile declares field paths, transforms, required fields, and the known quirks of that variant.
- `applyProfile` returns either a canonical record or a structured list of mapping errors. It never
  throws, because one bad record must not stop a run.
- Onboarding a new institution is authoring a profile and validating it against a sample, not editing
  the pipeline.

This is also what makes the work reviewable. A mapping profile is a diff a support engineer can read.
An `if` statement four levels into a sync job is not.

### 3. Silent success

The failure that does real damage. A run completes, reports success, and moves nothing inbound. No
error, no alert, no ticket. Six weeks later someone notices a report looks thin, and by then the
gap spans a giving season.

`packages/shared/src/crm/reconcile.ts` treats this as the primary check rather than an afterthought:

- Counts are recorded on both sides after every run, per direction and per entity type.
- A run reporting success with zero inbound records where the previous run had many is a finding, not
  a normal outcome.
- Other findings: count mismatch beyond a tolerance, a stalled direction, a spike in mapping errors,
  and drift in the share of records landing in the review queue. That last one is the early warning
  that a vendor release changed a field.
- Every finding carries a severity and a sentence a support person can read without opening code.

Thresholds are documented defaults, set before deployment. Setting a threshold after the first alert
is how you end up with thresholds tuned to make alerts stop.

### 4. Regression

The pattern people describe as "we fix it, then it breaks again." That is almost never carelessness.
It is a missing contract. If the only description of the expected payload lives in the code that
consumes it, then any change on the other side is undetectable until it is a production incident.

- Each direction has its own contract and its own tests, because they fail for different reasons and
  on different schedules.
- Fixtures are captured per environment variant, so a vendor change shows up as a failing test rather
  than as a support escalation.
- The mapping layer is the only place vendor field names appear. When something does change, the blast
  radius is one directory.

## Directional thinking

The single most useful reframe in this work: inbound and outbound are not one integration. They are
two products that happen to share a vendor.

| | Outbound, platform to CRM | Inbound, CRM to platform |
| --- | --- | --- |
| Who controls the payload | I do | The institution's configuration does |
| Dominant failure | Rejected writes, permissions, rate limits | Ambiguous identity, shape variance, silent empties |
| Right fix | Retry, backoff, idempotency keys | Canonical mapping, resolution rules, review queue |
| Right alert | Error rate and rejection reasons | Count mismatch and empty run detection |
| How it degrades | Loudly | Quietly |

Building them as one thing produces a system where the loud half masks the quiet half. Outbound looks
healthy, the dashboard is green, and inbound has been dark for a month.

## What I would build first if I started tomorrow

In this order, and the order is the point:

1. **Counts before code.** Per institution, per direction, per entity type, per run. Expected against
   observed. Nothing else can be prioritized honestly until this exists, and it is a week of work.
2. **A completeness measure per institution, on a cadence.** Not "did the sync run." Whether the full
   record set arrived this month. Publish it per institution so it is a shared number rather than a
   private one.
3. **The canonical model and one mapping profile.** Pick the most common environment. Prove the shape
   holds. Do not generalize to six systems on paper first.
4. **The review queue and the rule that goes with it.** No ambiguous record is written through. This
   is what buys trust from the team that owns the record of truth, and trust is the actual gate on
   adoption.
5. **Empty run and drift detection.** Cheap to build, catches the failure class that costs the most.
6. **Contract tests with per environment fixtures.** Turns regressions into failing builds.
7. **Then activation.** Field mapping and validation moved into onboarding, because most of these
   failures start at activation and only surface at runtime.

Only after all of that does building more connectors make sense. Coverage added on top of an
unmeasured pipeline just multiplies the number of places a silent failure can hide.

## What this approach does not solve

It does not remove the vendor constraint. The source data model is still wrong for the purpose, older
environments still lack fields that would settle a question outright, and the release schedule is
still not mine. What it does is move the constraint into one layer I can test, configure per
institution, and watch, so the conversation shifts from "the integration is broken" to "these eleven
institutions are producing ambiguous records at four times the normal rate, and here is the field
that changed."

That shift is the whole deliverable. It turns an unbounded reliability complaint into a list.
