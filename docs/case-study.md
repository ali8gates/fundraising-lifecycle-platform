# Case study: building the segment pipeline from zero

## My seat

This was at the American Heart Association. I worked hands on in our Salesforce instance on the donor
CRM and the pipeline data, and separately I owned the registry business, which had gone close to a
decade without being unified before I got it done.

That is the relevant background for everything below. I was not a product manager writing requirements
for a data problem I had heard about secondhand. I was in the records, working alongside the
fundraising and engagement teams who used them and the donor data team who owned them. The design
decisions in this document came out of that proximity, and the one that mattered most, holding
ambiguous records back instead of writing them through, came directly from the CRM team telling me
what would break.

## Where this started

A segment that produced less than one percent of the organization's fundraising goal. Under two
million dollars, from roughly thirty schools. The standing explanation was that schools are small
donors and the segment is not worth more investment.

I did not believe the explanation, because the numbers had no denominator. Nobody could tell me how
many schools had been contacted, how many were contacted twice, who owned a relationship, or what
happened after a first gift. A segment with no pipeline visibility does not have a performance
problem yet. It has a measurement problem, and until that is fixed every investment decision about it
is a guess.

So the first deliverable was not software. It was a defensible answer to "what is actually happening
here."

## The questions I asked, in order

I ran discovery with school advancement staff, the organization's school engagement team, regional
fundraising staff, and the donor data team. These are the questions that changed the design.

**To the advancement staff at schools:**

- Walk me through the last time you added someone new to your prospect list. What did you open first?
- Who else in the building needs to know when you talk to a parent?
- If I gave you a new system, what would have to happen in the first week for you to keep using it?
- What do you currently do twice because two systems do not talk?

The answer to the last two set the adoption bar. These are one and two person offices that also run
events and communications. Anything that added work in week one was dead, no matter how good it was
in month six.

**To the fundraising and engagement teams:**

- When you decide to visit a school, what makes that decision? Show me the last three.
- What would you need to see to justify a visit to a school you have never worked with?
- When a gift comes in, how do you know which initiative it belongs to?

That last question exposed the real gap. Attribution was manual and inconsistent, which meant the
segment could never prove its own contribution even when it produced one.

**To the donor data and CRM team:**

- What has gone wrong before when a new system wrote into the CRM?
- What would you need to be true before you would let this participate in the data flow?
- Where in the record model does a school contact not fit?

This conversation was the most valuable of the whole discovery, and it is the one I would have skipped
if I had been moving faster. Their objection was not territorial. It was that a household and
constituent model does not cleanly represent a school contact, so any automated write risks creating
duplicates or misattributing a gift to the wrong household member. That objection produced two of the
most important design decisions: the canonical model, and the rule that an ambiguous record is never
written through.

**The question I asked myself:**

- What is the limiting factor, honestly? Not the most interesting problem. The one that caps the
  outcome.

The answer was not scoring, not the interface, and not reporting. It was that records could not move
between systems in a form anyone trusted. That is where I spent the build.

## Telling the ask from the need

Two examples worth keeping.

The ask was a dashboard. Several people described wanting a dashboard of school activity. The need was
to not be embarrassed in a leadership meeting by not knowing the state of a relationship. A dashboard
would have satisfied the ask and missed the need, because the underlying records were incomplete. I
built the record and the owner first, and the view of it second, which is the opposite order from what
was requested.

The ask was a score. Fundraisers asked for a prospect score. When I showed an early version with a
numeric score, they did not trust it and could not act on it, because a number does not tell you what
to say on a call. So the interface shows the tier and the reasons behind it, and hides the score. Same
engine underneath, different output contract. Adoption changed immediately. That single change did more
for usage than any feature I shipped.

## Tradeoffs I made on purpose

**Built internally instead of buying a prospect research subscription.** The commercial tools were
priced per seat and per year, and I needed roughly fourteen deployments, with attribution to internal
initiatives that no external tool would model. The tradeoff is real: I own the maintenance, and if I
had left, someone would have inherited it. I took that tradeoff because the recurring cost was a
hosting bill and two paid data feeds, well under a single commercial seat, and because the attribution
requirement was not purchasable.

**Public signals first, paid feeds second.** The ingestion layer started with feeds, filings, and site
text, all free. Paid connectors were added behind configuration only after the free layer proved that
the qualification criteria worked. If the criteria are wrong, paying for better input just produces
wrong answers faster.

**Read from the CRM before writing to it.** The write path was the one that could damage the record of
truth, so it went last and it went through the review queue. This slowed down the demo and was the
right call.

**No cross institution scoreboard.** Each school saw its own pipeline. Comparative rankings across
institutions would have been easy to build and would have poisoned the relationships that made the
program work.

**Reasons over scores in the interface.** Covered above. The cost is that a reason list is harder to
sort by than a number. Worth it.

**Sixty days, so some things were cut.** No mobile interface. No automated email sending, since a
send from a shared system needed a governance conversation I did not want to block on. No historical
backfill beyond one seeded pass. Single tenant per deployment rather than a shared multi tenant model,
which was the right call for speed and the wrong call for scale, and I would build it differently now.

## How I worked with engineering and the fundraising teams

I wrote the schema, the criteria engine, and the mapping layer myself, and I wrote the tests for the
parts I expected to break. That was not because there was no engineering team. It was because the
fastest way to settle an argument about whether a household record can be resolved was to write the
resolution rules and show the failure rate on real shapes.

What that changed in practice: engineering review conversations started from working code and a test
that failed for the right reason, rather than from a document describing what someone should build.
When engineering disagreed with a data model decision, we had something concrete to disagree about.
I handed off the pipeline work with the contracts and fixtures already in place.

With the fundraising teams, I ran a weekly session against the actual product rather than a mockup.
The rule I set for myself was to bring the thing they asked for last week even if I thought it was
wrong, show it, and let them tell me. That is how the score to reasons change happened, and I would
not have arrived at it by arguing.

With the donor data team, I reviewed the write path with them before it existed, agreed the review
queue rule in advance, and gave them the reconciliation counts as their own artifact rather than as
part of my reporting. They became the reason the program was allowed to grow rather than the obstacle
to it.

## Outcomes

- Shipped in about sixty days, first customer conversation to deployed product.
- Deployed to roughly fourteen schools.
- Eighty thousand dollars in new giving over the six months after launch, from net new donors
  attributed to prospecting, tied to named strategic initiatives.
- Weekly manual prospect research across the team stopped being the way this work got done.
- Recurring cost was a hosting bill and two paid data feeds, well under the quoted annual price of a
  single commercial prospect research seat.

## What I would do differently

**Multi tenant from the start.** Single tenant per deployment was correct for sixty days and wrong by
school number twenty. I would eat two extra weeks up front now.

**Completeness as the headline metric, from week one.** I measured pipeline stages first and data
completeness per institution second. That is backwards. The share of institutions sending complete
data on a cadence is the number that governs whether anything else works, and I should have published
it from the beginning rather than deriving it later.

**Activation as a product surface.** I treated field mapping and validation as an engineering setup
task. Most failures start at activation and only surface at runtime, so the mapping and validation
step deserved a real interface and an owner, not a runbook.

**A named owner for the platform before launch, not after.** I built it, which meant I was the
maintenance plan. That is a single point of failure and I should have designed the handoff into the
sixty days instead of after them.
