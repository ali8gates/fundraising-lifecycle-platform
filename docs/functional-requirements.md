# Functional requirements

I wrote these requirements for the working pipeline and the CRM integration work that follows it. They state the behavior I needed, the evidence that establishes it, and the code location that implements it. A requirement marked **not built** is intentionally not represented as completed product behavior.

## Identify

### FR-ID-01: Ingest source signals

**Requirement.** I require the system to collect candidate signals from configured public feeds and create records that retain their source context.

**Acceptance criteria.**

- Given a valid configured feed response, a worker job creates a signal associated with the relevant company record.
- A stored signal retains sufficient source information for a user to review why the candidate entered the pipeline.
- The RSS conversion test passes for supported RSS input.

**Implementation.** `apps/worker/src/index.ts`, `apps/worker/src/queue.ts`, `apps/worker/src/jobs/rssIngest.ts`, `apps/worker/src/connectors/rss.ts`, and `packages/db/prisma/schema.prisma`.

### FR-ID-02: Enrich a candidate from website data

**Requirement.** I require the system to enrich a candidate using its website before it is assessed for program fit.

**Acceptance criteria.**

- Given a company with a website, the enrichment job obtains the available website evidence.
- Enrichment output is available to downstream fit extraction.
- A failed enrichment does not create a qualified state by itself.

**Implementation.** `apps/worker/src/jobs/enrichmentPipeline.ts`, `apps/worker/src/services/websiteEnrichment.ts`, and `packages/shared/src/fit/extractCompanySignals.ts`.

### FR-ID-03: Keep one pipeline record per resolved company

**Requirement.** I require the system to retain a distinct company record only when the candidate can be resolved as a separate entity.

**Acceptance criteria.**

- A candidate with sufficient identity evidence can be stored as a `Company` with related `Signal` records.
- A candidate that cannot be resolved as distinct does not progress as a separate active prospect.
- The company list and detail routes return the retained company record rather than an unlinked signal.

**Implementation.** `packages/db/prisma/schema.prisma`, `apps/web/app/api/companies/route.ts`, and `apps/web/app/api/companies/[id]/route.ts`.

### FR-ID-04: Support the configured feed set

**Requirement.** I require the worker to use connectors for the feed types represented in the repository without putting connector field assumptions into the pipeline state model.

**Acceptance criteria.**

- The worker has isolated adapters for RSS, HTML, SEC, SEC EDGAR, business, news, market, health, and corporate registry feeds represented in the codebase.
- A connector-specific field does not become a required `Company` field solely because one feed provides it.
- Connector configuration can be listed through the connectors API.

**Implementation.** `apps/worker/src/connectors/` and `apps/web/app/api/connectors/route.ts`.

## Qualify

### FR-QL-01: Apply written fit criteria

**Requirement.** I require the system to evaluate each identified company against explicit program-fit and company-filter criteria.

**Acceptance criteria.**

- Given a company and its extracted evidence, the fit engine returns a result based on configured criteria.
- A change to criteria can be previewed before it is used for active scoring.
- Fit-engine and scoring tests pass for their covered cases.

**Implementation.** `packages/shared/src/program-fit.ts`, `packages/shared/src/company-filter.ts`, `packages/shared/src/fit/fitEngine.ts`, `apps/web/app/api/scoring/config/route.ts`, `apps/web/app/api/scoring/preview/route.ts`, `packages/shared/tests/fitEngine.test.ts`, and `packages/shared/tests/scoring.test.ts`.

### FR-QL-02: Explain the qualification result

**Requirement.** I require the system to show the reasons and tier behind a qualification result, not only a numerical score.

**Acceptance criteria.**

- A scored company has fit evidence that identifies the criteria behind its result.
- A user can view scoring information in the scoring interface.
- The company interface can display the score context associated with the record.

**Implementation.** `packages/shared/src/scoring.ts`, `packages/shared/src/fit/classifier.ts`, `packages/shared/src/fit/taxonomy.ts`, `apps/web/app/scoring/page.tsx`, and `apps/web/components/ScoreBar.tsx`.

### FR-QL-03: Record qualification state and history

**Requirement.** I require the system to move a company that meets criteria to `QUALIFIED` and retain a score snapshot for later review.

**Acceptance criteria.**

- A qualifying result maps to the `QUALIFIED` stored state.
- The data model supports `ScoreSnapshot` records associated with the company.
- A backfill can apply fit computation to existing records.

**Implementation.** `packages/shared/src/lifecycle.ts`, `packages/db/prisma/schema.prisma`, and `apps/worker/src/scripts/backfillFit.ts`.

## Cultivate

### FR-CD-01: Record meetings

**Requirement.** I require the system to allow a user to create and retain meeting activity for a qualified company.

**Acceptance criteria.**

- An authenticated request to the meetings route creates meeting activity for a valid company.
- A company detail view exposes the context needed to work the relationship.
- The `Meeting` model is part of the persisted data model.

**Implementation.** `apps/web/app/api/meetings/route.ts`, `apps/web/app/companies/[id]/page.tsx`, and `packages/db/prisma/schema.prisma`.

### FR-CD-02: Support contact discovery and relationship preparation

**Requirement.** I require the system to return discovered executive contacts for a company when the company detail workflow requests them.

**Acceptance criteria.**

- Given a company identifier, the executive-contact route returns the supported contact discovery result.
- The company detail interface can request and display that result.
- Contact discovery is separated from company persistence logic.

**Implementation.** `apps/web/app/api/companies/[id]/linkedin-executives/route.ts`, `packages/shared/src/linkedin.ts`, `apps/web/hooks/useLinkedInExecutives.ts`, and `apps/web/components/LinkedInExecutives.tsx`.

### FR-CD-03: Make cultivation stage visible

**Requirement.** I require the system to show when a company has progressed to `MEETING_SCHEDULED`.

**Acceptance criteria.**

- The shared lifecycle mapping identifies cultivation with `MEETING_SCHEDULED`.
- Company list and detail views render the current stage.
- A user can retrieve the company state through the company routes.

**Implementation.** `packages/shared/src/lifecycle.ts`, `apps/web/components/StageBadge.tsx`, `apps/web/app/companies/page.tsx`, and `apps/web/app/api/companies/[id]/route.ts`.

## Solicit

### FR-SL-01: Track outreach activity and outcome

**Requirement.** I require the system to retain outreach activity with its channel and outcome for a company in solicitation.

**Acceptance criteria.**

- The data model defines `OutreachEvent`.
- Outreach activity can be associated with the company record used in the company workflow.
- The shared lifecycle mapping identifies solicitation with `IN_DISCUSSION`.

**Implementation.** `packages/db/prisma/schema.prisma`, `packages/shared/src/lifecycle.ts`, `apps/web/app/api/companies/[id]/route.ts`, and `apps/web/app/companies/[id]/page.tsx`.

### FR-SL-02: Preserve context for the ask

**Requirement.** I require the system to keep qualification, meeting, and outreach context together when an ask is under discussion.

**Acceptance criteria.**

- The company model can be read through a single detail route.
- The detail interface presents the company context and current stage.
- Meeting and outreach models remain associated with the company rather than held only in a separate inbox or spreadsheet.

**Implementation.** `apps/web/app/api/companies/[id]/route.ts`, `apps/web/app/companies/[id]/page.tsx`, `apps/web/components/CompanyCard.tsx`, and `packages/db/prisma/schema.prisma`.

### FR-SL-03: Record gift amount and formal ask terms

**Requirement.** I require the system to capture gift amount, commitment terms, and ask terms as structured solicitation data.

**Acceptance criteria.**

- A user can create and retrieve a structured gift or commitment record linked to the solicitation.
- The stored model distinguishes a prospecting signal from a gift fact.
- Validation rejects incomplete required gift fields.

**Implementation.** **not built.** `packages/shared/src/crm/canonical.ts` defines canonical gift concepts for CRM mapping, but the pipeline does not yet implement a formal gift or commitment workflow.

## Steward

### FR-ST-01: Retain active and closed relationship states

**Requirement.** I require the system to distinguish active stewardship from a lapsed or closed relationship.

**Acceptance criteria.**

- The lifecycle mapping identifies `MEMBER` and `ARCHIVED` as stewardship states.
- A closed record remains retrievable rather than being deleted from the lifecycle history.
- Company views show the stored stage.

**Implementation.** `packages/shared/src/lifecycle.ts`, `packages/db/prisma/schema.prisma`, `apps/web/components/StageBadge.tsx`, and `apps/web/app/companies/[id]/page.tsx`.

### FR-ST-02: Support renewal and lapse review

**Requirement.** I require the system to retain prior score and activity context needed to review renewal and lapse handling.

**Acceptance criteria.**

- The data model supports score snapshots, meetings, and outreach events for the company.
- A user can inspect the company detail workflow without removing historical records.
- Stewardship status can be represented as either active or archived.

**Implementation.** `packages/db/prisma/schema.prisma`, `apps/web/app/api/companies/[id]/route.ts`, and `apps/web/app/companies/[id]/page.tsx`.

### FR-ST-03: Automate renewal outreach

**Requirement.** I require the system to create renewal tasks or reminders based on stewardship status and renewal timing.

**Acceptance criteria.**

- A user can configure a renewal condition for an active relationship.
- The system creates a visible follow-up task when that condition is met.
- The task is linked to the company and its stewardship state.

**Implementation.** **not built.** The current repository retains lifecycle history but does not provide a renewal-task workflow.

## Canonical data model and CRM mapping

### FR-CDM-01: Define canonical constituent and gift concepts

**Requirement.** I require the integration layer to use a canonical constituent and gift model before applying source-specific field names.

**Acceptance criteria.**

- A canonical model defines the constituent and gift concepts consumed by CRM adapters.
- Pipeline code does not require a source CRM field name to describe these concepts.
- Mapping code imports the canonical model rather than redefining entity meaning per source.

**Implementation.** `packages/shared/src/crm/canonical.ts` and `packages/shared/src/crm/mapping.ts`.

### FR-CDM-02: Use environment-specific mapping profiles

**Requirement.** I require the integration layer to select a mapping profile based on the customer's edition and configuration instead of branching the shared workflow for each environment.

**Acceptance criteria.**

- Mapping profiles can represent different source field mappings.
- An environment's configuration selects the applicable mapping profile.
- A profile change is localized to mapping configuration rather than requiring lifecycle model changes.

**Implementation.** `packages/shared/src/crm/mapping.ts` and `packages/db/prisma/schema.prisma` for `AppConfig`.

### FR-CDM-03: Resolve household roles explicitly

**Requirement.** I require the integration layer to resolve adult and child household roles with rules and a confidence result before producing a write candidate.

**Acceptance criteria.**

- A household resolution result distinguishes adult and child roles where evidence supports it.
- The result includes a confidence value or an unresolved result.
- The household-resolution tests pass for covered cases.

**Implementation.** `packages/shared/src/crm/household.ts` and `packages/shared/tests/crm-household.test.ts`.

### FR-CDM-04: Hold ambiguous records for review

**Requirement.** I require the integration layer to hold an ambiguous household or constituent record for review and never write it through to a system of record.

**Acceptance criteria.**

- A record that remains ambiguous is not emitted as a write candidate.
- The result identifies the ambiguity for review.
- No ambiguous record is ever written through to a system of record.

**Implementation.** `packages/shared/src/crm/household.ts` and `packages/shared/tests/crm-household.test.ts`.

## Bidirectional sync and reliability

### FR-SY-01: Treat inbound and outbound sync as separate contracts

**Requirement.** I require the integration layer to define and test inbound and outbound CRM sync independently.

**Acceptance criteria.**

- Reconciliation accepts directional input rather than one undifferentiated sync outcome.
- A failure in inbound processing can be identified without reporting outbound processing as failed.
- Directional reconciliation tests pass for covered cases.

**Implementation.** `packages/shared/src/crm/reconcile.ts` and `packages/shared/tests/crm-reconcile.test.ts`.

### FR-SY-02: Detect count mismatches after each sync run

**Requirement.** I require the integration layer to compare expected and observed results on both sides after each directional run.

**Acceptance criteria.**

- The reconciliation result identifies a mismatch between expected and observed counts.
- A matched result is distinguishable from a mismatch result.
- A mismatch remains visible to operations rather than being treated as success.

**Implementation.** `packages/shared/src/crm/reconcile.ts` and `packages/shared/tests/crm-reconcile.test.ts`.

### FR-SY-03: Preserve source identifiers and mapping decisions

**Requirement.** I require the integration layer to retain the identifiers and mapping result needed to reconcile a source record with its canonical record.

**Acceptance criteria.**

- Mapping output contains the source-to-canonical result required for reconciliation.
- A source-specific identifier is not used as the sole definition of the canonical constituent.
- An unresolved identifier mismatch can be returned for review rather than converted into a write.

**Implementation.** `packages/shared/src/crm/canonical.ts`, `packages/shared/src/crm/mapping.ts`, and `packages/shared/src/crm/reconcile.ts`.

### FR-SY-04: Execute CRM transport adapters

**Requirement.** I require the system to send and receive records through production CRM transport adapters.

**Acceptance criteria.**

- A configured CRM connection can run an outbound write.
- A configured CRM connection can run an inbound read.
- Transport outcomes feed the directional reconciliation result.

**Implementation.** **not built.** The repository contains the canonical model, mappings, household resolution, and reconciliation boundary, but not a production CRM transport adapter.

## Observability and monitoring

### FR-OB-01: Expose connector health

**Requirement.** I require the system to provide an authenticated health view for operational dependencies and connector state.

**Acceptance criteria.**

- An authenticated request to the health route returns the supported application health result.
- The connectors route returns configured connector information.
- The settings interface provides an operational location for configuration review.

**Implementation.** `apps/web/app/api/health/route.ts`, `apps/web/app/api/connectors/route.ts`, and `apps/web/app/settings/page.tsx`.

### FR-OB-02: Surface a directional sync failure

**Requirement.** I require the integration layer to produce a visible reconciliation failure when a directional sync has a count mismatch or unresolved result.

**Acceptance criteria.**

- A mismatch is represented by the reconciliation result.
- The result identifies its direction.
- Tests cover the failure result for the reconciliation logic.

**Implementation.** `packages/shared/src/crm/reconcile.ts` and `packages/shared/tests/crm-reconcile.test.ts`.

### FR-OB-03: Send operational alerts for sync degradation

**Requirement.** I require the system to notify an operator when reconciliation identifies a directional degradation.

**Acceptance criteria.**

- A mismatch produces an alert in an operator-owned channel.
- The alert identifies the environment and direction.
- The alert includes the reconciliation result needed for investigation.

**Implementation.** **not built.** The repository detects reconciliation conditions, but it does not contain an alert delivery integration.

## Onboarding and activation

### FR-ON-01: Capture configuration before activation

**Requirement.** I require the system to record the connector and mapping configuration required for a customer environment before an integration is activated.

**Acceptance criteria.**

- A configuration record can be persisted.
- A user can access the settings interface through the authenticated application.
- The selected mapping profile can be tied to the environment configuration.

**Implementation.** `packages/db/prisma/schema.prisma`, `apps/web/app/settings/page.tsx`, `apps/web/app/api/connectors/route.ts`, and `packages/shared/src/crm/mapping.ts`.

### FR-ON-02: Provide field-mapping validation steps

**Requirement.** I require the integration setup to provide a repeatable validation process for field mapping and household-role assumptions before scheduled data exchange.

**Acceptance criteria.**

- The process identifies required source fields and their canonical destinations.
- The process tests household-role outcomes for supplied records.
- A failed validation blocks activation until the ambiguity or mapping issue is resolved.

**Implementation.** **not built.** The code contains mapping and household-resolution logic, but it does not yet contain the full onboarding validation workflow.

## Access and security

### FR-AS-01: Require application access before protected routes

**Requirement.** I require the application to use the access gate and middleware to protect the application workflow.

**Acceptance criteria.**

- A request without a valid access state is handled by middleware before protected application use.
- A user can sign in through the gate route and sign out through the signout route.
- Protected settings and operational routes are not intended for unauthenticated use.

**Implementation.** `apps/web/app/api/gate/route.ts`, `apps/web/app/api/gate/signout/route.ts`, and `apps/web/middleware.ts`.

### FR-AS-02: Limit CRM writes to resolved records

**Requirement.** I require the integration layer to permit a system-of-record write only for a record that has passed canonical mapping and household-role resolution.

**Acceptance criteria.**

- An unresolved household role prevents a write candidate from being emitted.
- A mapping result is available for a record considered for write.
- No ambiguous record is ever written through to a system of record.

**Implementation.** `packages/shared/src/crm/canonical.ts`, `packages/shared/src/crm/mapping.ts`, `packages/shared/src/crm/household.ts`, and `packages/shared/src/crm/reconcile.ts`.

### FR-AS-03: Provide role-based permissions and audit events

**Requirement.** I require the application to assign distinct user permissions and retain an audit event for sensitive configuration and CRM write actions.

**Acceptance criteria.**

- A user role controls whether a user can change connector configuration.
- A CRM write records the acting user, time, target record, and mapping profile.
- An operator can retrieve audit events for a selected record.

**Implementation.** **not built.** `User` and `Connector` are present in `packages/db/prisma/schema.prisma`, but this repository does not implement role-based authorization or a CRM-write audit trail.

## Reporting

### FR-RP-01: Report pipeline state by lifecycle stage

**Requirement.** I require the system to report the current pipeline grouped by the shared lifecycle stage model.

**Acceptance criteria.**

- A report groups company records by the lifecycle stage mapping.
- `MEMBER` and `ARCHIVED` are reported as stewardship outcomes.
- The report uses shared stage definitions rather than duplicating labels in each view.

**Implementation.** **not built.** `packages/shared/src/lifecycle.ts` provides the stage contract and the company pages show individual records, but this repository does not contain a reporting route or report view.

### FR-RP-02: Report prospecting-attributed giving by initiative

**Requirement.** I require the system to report giving from net new donors attributed to prospecting and associated with a strategic initiative.

**Acceptance criteria.**

- A report distinguishes prospecting-attributed giving from other giving.
- The report retains the strategic-initiative association.
- The report can trace a reported value to its source gift record.

**Implementation.** **not built.** The repository does not yet contain the formal gift model and reporting workflow required for this report.

### FR-RP-03: Report integration completeness and reconciliation status

**Requirement.** I require the system to report whether each configured environment is sending complete data on its intended cadence and whether directional reconciliation is passing.

**Acceptance criteria.**

- The report identifies the latest completed directional run for an environment.
- The report distinguishes a matched run from a mismatch or unresolved result.
- The report can be reviewed by operations without reading worker logs.

**Implementation.** **not built.** `packages/shared/src/crm/reconcile.ts` supplies the reconciliation result, but no environment-level reporting surface is present.

## Non-functional requirements

### NFR-01: Run cadence

**Requirement.** I require the worker to execute ingestion and enrichment on the cadence configured for each connector.

**Acceptance criteria.**

- A connector's configured cadence can be read by the worker scheduling path.
- Changing cadence does not require a lifecycle-code change.

**Implementation.** `apps/worker/src/queue.ts`, `apps/worker/src/index.ts`, and `packages/db/prisma/schema.prisma` for connector configuration.

### NFR-02: Idempotency

**Requirement.** I require a repeated job or inbound record to avoid a duplicate company, signal, meeting, outreach event, or system-of-record write.

**Acceptance criteria.**

- Repeating a covered worker job does not create a duplicate persisted business record.
- A repeated inbound CRM record does not produce an additional system-of-record write.

**Implementation.** The `Company`, `Signal`, `Meeting`, and `OutreachEvent` model is in `packages/db/prisma/schema.prisma`; end-to-end CRM transport idempotency is **not built**.

### NFR-03: Third-party feed rate limits

**Requirement.** I require connector execution to observe each third-party feed rate limit and keep feed-specific handling in the adapter.

**Acceptance criteria.**

- A connector cannot exceed its configured request limit during a run.
- A feed-specific limit is implemented without changing the shared lifecycle model.

**Implementation.** Connector isolation is present in `apps/worker/src/connectors/`; explicit rate-limit policy and tests are **not built**.

### NFR-04: Retry and backoff

**Requirement.** I require transient connector and transport errors to use bounded backoff, while permanent validation failures are retained for review.

**Acceptance criteria.**

- A transient failure produces a bounded retry according to the configured policy.
- A permanent validation failure is retained for review rather than retried without limit.

**Implementation.** Queue execution exists in `apps/worker/src/queue.ts`; explicit retry classification and backoff policy are **not built**.

### NFR-05: Data retention

**Requirement.** I require lifecycle history to preserve decision evidence while retention rules for source payloads and CRM data are defined before production CRM transport is enabled.

**Acceptance criteria.**

- A retained lifecycle record includes the evidence needed to explain its pipeline decision.
- A production CRM transport release cannot proceed without an approved source-payload and CRM-data retention rule.

**Implementation.** Historical models exist in `packages/db/prisma/schema.prisma`; a documented retention policy and deletion process are **not built**.

### NFR-06: No ambiguous write-through

**Requirement.** I require that no ambiguous record is ever written through to a system of record.

**Acceptance criteria.**

- A record with an unresolved household role, mapping result, or identifier mismatch is held for review.
- A covered ambiguity test produces no write candidate.

**Implementation.** `packages/shared/src/crm/household.ts`, `packages/shared/src/crm/mapping.ts`, `packages/shared/src/crm/reconcile.ts`, and `packages/shared/tests/crm-household.test.ts`.

## Deliberately out of scope

I did not build a production CRM transport adapter, automatic renewal tasks, a formal gift and commitment workflow, alert delivery, a full onboarding validation flow, role-based authorization, audit logging for CRM writes, pipeline reporting, or integration-completeness reporting. I kept these items out of the working scope because the first need was a visible and defensible prospect lifecycle, followed by a safe canonical boundary for CRM data. Marking them as absent is preferable to implying that shared types or a health route provide behavior they do not provide.
