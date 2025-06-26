# How I Lead a Client Engagement

The fundraising and school teams were my customers on this build. These are the habits that got it from a first conversation to a deployed product in about sixty days, with what each looked like here.

## The hats I wore

I led the technical side of this build and worked across several roles to get it live in about sixty days.

- **Discovery lead.** Mapped the fundraising teams, the donor data team, school advancement staff, and engineering, and what each needed.
- **Product owner.** Made the calls that shaped adoption, like building the record before the dashboard and showing reasons instead of a score.
- **Data and integration lead.** Worked inside the CRM and designed the mapping layer and review queue with the donor data team.
- **Hands on engineer.** Wrote the schema, the criteria engine, and the mapping layer, plus the tests for the parts I expected to break.
- **Rollout lead.** Ran weekly sessions on the real product and took it to roughly fourteen schools.

## Earning trust early and finding who matters

In the first weeks I mapped four groups: regional fundraising staff and initiative owners, the donor data and CRM team who owned the record of truth, school advancement staff who were often one or two people, and engineering. The group most likely to block the work was the donor data team, and they were right to be cautious. I brought them in before the write path existed, agreed the review rule with them in advance, and gave them the reconciliation counts as their own report. They became the reason the program was allowed to grow.

## Hearing the need behind the ask

People asked for a dashboard. What they needed was to never be caught out in a leadership meeting not knowing the state of a relationship. A dashboard on incomplete records would have met the ask and missed the need, so I built the record and its owner first and the view second. Fundraisers also asked for a prospect score. When they saw one, they did not trust it and could not act on it, so the product shows the tier and the reasons instead. That one change did more for adoption than any feature I shipped.

## Using early demos to learn the domain

I ran a weekly session on the real product, not a mockup. My rule was to bring what they asked for last week, even if I thought it was wrong, show it, and let them react. That is how I learned what a school contact looks like in a donor system built for households, and it is how the score to reasons change happened.

## Talking early and often

The sixty day timeline only held because problems came up the week they appeared. When it became clear the CRM's household model did not fit school contacts cleanly, I took it straight to the data team with the options and the tradeoff, and we agreed the review queue rule together instead of me quietly working around it.

## Not over-promising

I was honest about the numbers. Eighty thousand dollars in new giving in six months is not large against a national goal, and I said so. It mattered because it came from a segment that had produced almost nothing, it was attributable, and it came from fourteen schools, which made the per school case credible for the first time.

## Setting the team up to do their best work

I handed engineering the pipeline work with the contracts and test data already in place, so they could own it and push back on something concrete. The donor data team owned their reconciliation. Each group got the part where their expertise counted most.

## Leading and building at the same time

I wrote the schema, the criteria engine, and the mapping layer myself. Design arguments started from working code and a failing test instead of a document, which kept the team moving fast and showed the level of ownership I expected.
