# Rryda Port — Phase 2 (frontend-only continued)

Three files, all typechecked clean against your real dependency tree.

## New: src/components/QuickReactionBar.tsx
RN port of Rryda's `QuickReactionFloatingBar` — a small emoji button row
that spawns a rising, drifting emoji animation when tapped. Built on the
exact same "purely local, purely decorative" pattern your own
`FloatingHeartsOverlay` already uses and documents: no backend field for
reaction counts or history exists anywhere in this app, so it never
claims to persist, sync to other viewers, or count toward anything real
— it's a same-device expressive touch, same honesty level as the
double-tap hearts.

Wired into `LiveViewerScreen.tsx` right below `FloatingHeartsOverlay`,
positioned bottom-right. Drop-in usable elsewhere too (e.g. `RoomScreen`)
by importing it the same way — takes no required props, or pass a custom
`emojis` array / `orientation="vertical"`.

## Changed: src/screens/live/GoLiveScreen.tsx
Filter catalog expanded from 7 to 9 to match Rryda's set: added
**Golden** (golden_hour) and **Cyber** (cyberpunk), using the same
tint-overlay technique as every other filter here — no new rendering
machinery. Left out `vintage_film`, since at this tint-overlay fidelity
it reads as a near-duplicate of the existing Mono/Warm filters.

## Changed: src/screens/live/LiveViewerScreen.tsx
Just the two lines wiring `QuickReactionBar` in.

## On the beauty/AR side — nothing changed, on purpose
I went in expecting to port Rryda's beauty sliders and AR stickers, but
your `LiveToolsSheet`/`useAgoraEngine` beauty implementation is already
wired to Agora's *real* native beauty API (`lighteningLevel`,
`smoothnessLevel`, `rednessLevel`, plus real `FaceShapeArea` parameters
for eyes/nose/chin/forehead/lip) — more faithful than Rryda's mocked
sliders, not less. AR stickers are honestly disabled with "not available
in this build" rather than faked. There wasn't anything to improve here
without either duplicating a filter or inventing a beauty parameter
Agora doesn't actually support — so I left it alone.

## Still waiting on backend work (unchanged from phase 1)
Top Gifters / Top Hosts leaderboards, gifter tiers, VIP entrance
banners + automated welcome messages, and gift entrance effects all
still need new backend fields before they can be built without faking
data. Let me know if you want the schema/endpoint sketch for any of
these next.
