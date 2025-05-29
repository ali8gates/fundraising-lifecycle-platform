# Lifecycle model

I organized the product around identify, qualify, cultivate, solicit, and steward. It gives the team explicit state and the next decision, instead of disconnected research notes, inbox threads, and CRM records.

The table maps business stages to the Prisma `Stage` enum. `ARCHIVED` is a terminal stewardship outcome, not its own stage.

| Lifecycle stage | Prisma `Stage` value | Purpose |
| --- | --- | --- |
| identify | `NEW` | Collect and verify a possible relationship. |
| qualify | `QUALIFIED` | Decide whether the record meets written criteria. |
| cultivate | `MEETING_SCHEDULED` | Build the relationship and prepare for an ask. |
| solicit | `IN_DISCUSSION` | Record the ask and its outcome. |
| steward | `MEMBER`, `ARCHIVED` | Maintain an active relationship or record a lapse or closure. |

## Identify

**What enters.** A public signal, a supplied company record, or a candidate from website enrichment enters unverified.

**Decision.** I decide whether the candidate is a distinct entity worth retaining as `NEW`, rather than a duplicate, irrelevant result, or incomplete record.

**Data required.** I need source evidence, identity fields, website content, and information to compare the candidate with existing companies.

**What exits.** A deduplicated `Company` with related `Signal` records exits into `NEW`. A candidate that cannot be established as distinct does not progress.

**Failure mode I saw in practice.** Research was in spreadsheets and inboxes while donor records were in the CRM. A prospect could be researched twice, and a useful signal could remain invisible to the person planning outreach.

**Code paths.** Ingestion is in `apps/worker/src/index.ts`, `apps/worker/src/queue.ts`, and `apps/worker/src/jobs/rssIngest.ts`. Enrichment is in `apps/worker/src/jobs/enrichmentPipeline.ts` and `apps/worker/src/services/websiteEnrichment.ts`. Feed adapters include `apps/worker/src/connectors/rss.ts`, `apps/worker/src/connectors/html.ts`, and `apps/worker/src/connectors/sec.ts`. `Company` and `Signal` are in `packages/db/prisma/schema.prisma`.

## Qualify

**What enters.** A distinct `NEW` company with source evidence enters qualification.

**Decision.** I decide whether it meets written program and company criteria, which tier applies, and why a person should spend time on it. The product presents reasons, not only a score.

**Data required.** I need signals, fit criteria, company filters, taxonomy, evidence, and scoring configuration.

**What exits.** A record that meets criteria exits as `QUALIFIED`, with a tier, fit evidence, and a `ScoreSnapshot`. A record that does not meet criteria stays out of the active pipeline or is later archived.

**Failure mode I saw in practice.** The team lacked a defensible basis for choosing one school or prospect over another. A score without rationale does not help review.

**Code paths.** Scoring is in `packages/shared/src/scoring.ts`, `packages/shared/src/program-fit.ts`, and `packages/shared/src/company-filter.ts`. The fit engine is in `packages/shared/src/fit/fitEngine.ts`, `packages/shared/src/fit/classifier.ts`, and `packages/shared/src/fit/extractCompanySignals.ts`. Configuration is in `apps/web/app/api/scoring/config/route.ts` and `apps/web/app/api/scoring/preview/route.ts`. Tests are `packages/shared/tests/fitEngine.test.ts` and `packages/shared/tests/scoring.test.ts`.

## Cultivate

**What enters.** A `QUALIFIED` company with a reason to contact it enters cultivation.

**Decision.** I decide whether a relationship has enough momentum for a meeting and who should be involved. A scheduled meeting maps to `MEETING_SCHEDULED`.

**Data required.** I need contact discovery, company detail, relationship context, meeting details, and qualification rationale.

**What exits.** A meeting record and a relationship plan exit into `MEETING_SCHEDULED`. The record either progresses toward an ask or returns for further work.

**Failure mode I saw in practice.** Contact context and meeting activity were easy to lose between research and relationship management.

**Code paths.** Meeting creation is in `apps/web/app/api/meetings/route.ts`. Company routes are `apps/web/app/api/companies/route.ts` and `apps/web/app/api/companies/[id]/route.ts`. Contact discovery is in `apps/web/app/api/companies/[id]/linkedin-executives/route.ts`, `packages/shared/src/linkedin.ts`, and `apps/web/hooks/useLinkedInExecutives.ts`. The interface includes `apps/web/app/companies/[id]/page.tsx` and `apps/web/components/LinkedInExecutives.tsx`.

## Solicit

**What enters.** A company in `MEETING_SCHEDULED` with an established relationship and a planned ask enters solicitation.

**Decision.** I decide what outreach occurs, through which channel, with what outcome, and whether the relationship remains in discussion.

**Data required.** I need company context, meeting history, outreach channel, outcome, ask detail, and current stage.

**What exits.** The record exits as `IN_DISCUSSION` with an `OutreachEvent` that records channel and outcome. It can then move to active membership or an archived stewardship outcome.

**Failure mode I saw in practice.** Outreach activity was separate from research and CRM records. It was hard to know whether an ask had a clear owner.

**Code paths.** `OutreachEvent`, `Meeting`, and `Company` are defined in `packages/db/prisma/schema.prisma`. The solicitation workflow uses `apps/web/app/api/companies/[id]/route.ts`, `apps/web/app/companies/[id]/page.tsx`, `apps/web/components/CompanyCard.tsx`, and `apps/web/components/StageBadge.tsx`.

## Steward

**What enters.** A relationship with an active membership or an outcome requiring closure enters stewardship.

**Decision.** I decide whether the relationship remains active, needs renewal attention, has lapsed, or should close. `MEMBER` indicates an active relationship and `ARCHIVED` records a lapse or closure.

**Data required.** I need relationship state, activity history, score snapshots, renewal information, and reconciled CRM facts.

**What exits.** An active relationship stays in `MEMBER` with history for follow-up. A closed or lapsed relationship exits to `ARCHIVED` without deleting its record.

**Failure mode I saw in practice.** Work stopped at the first gift or conversation. Renewal and lapse work became reactive.

**Code paths.** `ScoreSnapshot`, `OutreachEvent`, `Meeting`, and `Company` are in `packages/db/prisma/schema.prisma`. Company views are in `apps/web/app/companies/[id]/page.tsx` and `apps/web/components/StageBadge.tsx`. CRM reconciliation is in `packages/shared/src/crm/reconcile.ts`, with tests in `packages/shared/tests/crm-reconcile.test.ts`.

## Canonical stage model

I kept the five stages in `packages/shared/src/lifecycle.ts` instead of only in the database enum. The enum stores values, not business labels, stage guidance, or a mapping to more than one stored value. Shared code gives the web app, worker, tests, and CRM adapters one definition.

This made a stage rename controlled. `packages/db/src/migrate-outreach-to-qualified.ts` is the real example. I could update stored records through a focused migration while keeping the lifecycle contract explicit in shared code. Tests are in `packages/shared/tests/lifecycle.test.ts`.

The CRM boundary uses `packages/shared/src/crm/canonical.ts` for concepts, `packages/shared/src/crm/mapping.ts` for profiles, `packages/shared/src/crm/household.ts` for roles, and `packages/shared/src/crm/reconcile.ts` for direction checks. CRM field names do not become lifecycle vocabulary.

## What the model does not cover

This model does not decide fundraising strategy, set gift amounts, replace the CRM as the system of record, or infer a household role when evidence is ambiguous. It does not make customer environments identical. It records the lifecycle and provides a place for configuration, review, and reconciliation. An ambiguous record is held for review rather than written through to a system of record.
