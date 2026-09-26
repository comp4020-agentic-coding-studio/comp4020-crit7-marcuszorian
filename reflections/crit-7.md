# Crit 7 reflection

## What was the breakthrough that moved the work forward?

Realising that retiring a feature and deleting it are different things. My
first draft of the compatibility board removed the guestbook's SSE endpoint,
and to keep CI green I edited the deploy job so it stopped curling
`/api/events`. Everything passed. But that check existed because the deployed
site was expected to keep a live stream, and I had moved the goalposts rather
than met them. Reverting the CI edit and restoring the stream to broadcast
cards (`f2db71e`) was a small code change, but it reframed the rest of the
week: the starter's checks are contracts, and a run I made green by editing
the check proves nothing.

The other thing that moved the work was writing `PLAN-matching.md` before any
code. Pinning down what counts as a match in prose (Jaccard on tags plus
shared time blocks, zero-overlap pairs left out) gave the spec tests
something concrete to hold the implementation to.

## What did this work change about who I want to be as a software developer?

I want my history to tell the truth. This week it only partly does: I built
the feature before committing any of it and split it into commits afterwards,
so the record can't show that tests came first. I said so in `PROCESS.md`
rather than dress it up, because I'd rather own a gap than claim a discipline
I didn't practise. Next time I want commits to land as the work does, so
there's nothing to explain after the fact. More broadly, I want to treat a
green suite as backpressure, not proof, and to say exactly what I checked and
no more.
