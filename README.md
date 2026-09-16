# Real video (Agora) + PK, built on top of the previous Live session

Continues directly from the last session's README (Live join flow, gift
catalog, the fetchForYou/New/Nearby compile-blocking bug) — that work is
still all there; this is what got added on top of it.

## Real video via Agora — what's actually verified vs. not

`react-native-agora@4.6.4` is now wired into both `GoLiveScreen` (host,
local video) and `LiveViewerScreen` (viewer, remote video), via a new
`useAgoraEngine` hook and `AgoraVideoView` component.

**Verified for real, not assumed**: every single Agora SDK call used
(`createAgoraRtcEngine`, `.initialize()`, `.joinChannelWithUserAccount()`,
`.enableVideo()`, `.startPreview()`, `.muteLocalAudioStream()`,
`RtcSurfaceView`, the event handler names) was checked against the
actual installed package's `.d.ts` files before being used, the same way
`agora-token` was checked on the backend earlier in this project. This
caught one genuinely important detail: **the backend signs tokens
against a string "user account"** (`RtcTokenBuilder.buildTokenWithUserAccount`
in `agora-rtc-provider.ts`), not a numeric uid — so the mobile side has to
join with `joinChannelWithUserAccount()`, not the numeric `joinChannel()`.
Using the wrong one would have silently mismatched the identity scheme
the token was actually signed for, likely surfacing as a confusing
connection failure with no obvious cause.

**Not verified, and can't be from here**: this has never actually run on
a device, connected to Agora's servers, or rendered a real video frame.
This sandbox cannot run a native build at all. "The types match the SDK"
and "this actually shows video" are different claims — your own EAS dev
build is the real test.

**A real, separate bug found and fixed while wiring this up**: the
mobile `LiveSessionRaw` type was missing `providerChannel` — the Agora
channel name every join/publish call actually needs. It's on the
backend's response (`session.providerChannel`) and was simply never
added to the mobile type. Without this, no amount of correct SDK code
would have had a channel to actually join.

## Setting this up on your end

1. **You already have `AGORA_APP_ID`/`AGORA_APP_CERTIFICATE`** in the
   backend's `.env` from earlier. The App ID also needs to go in the
   mobile app — it's meant to be public/client-embedded (unlike the
   Certificate, which stays server-only and is what actually signs
   tokens). Set it in `app.json`:
   ```json
   "extra": {
     "agoraAppId": "<your real Agora App ID>"
   }
   ```
   (currently a placeholder string — replace it, or video will fail
   immediately with a clear "App ID is not configured" message rather
   than a confusing native error)

2. **This needs an EAS development build — Expo Go cannot run this.**
   Agora's SDK includes native code Expo Go doesn't bundle. Steps:
   ```bash
   npm install -g eas-cli   # if you don't have it
   eas login
   eas build --profile development --platform android
   ```
   This takes several minutes (a real cloud build, not a local compile)
   and produces an installable `.apk` — install it on your phone the
   same way you'd install any APK. Once installed, you run
   `npx expo start --dev-client` instead of the old `npx expo start`, and
   your existing dev-client app (not Expo Go) connects to it. JS-only
   changes still hot-reload normally inside it; only native dependency
   changes need a fresh `eas build`.

3. Camera/microphone permissions are already declared in `app.json`
   (`NSCameraUsageDescription`/`NSMicrophoneUsageDescription` for iOS,
   `CAMERA`/`RECORD_AUDIO`/`MODIFY_AUDIO_SETTINGS` for Android) — the
   build should prompt for these on first use, nothing further to
   configure.

## PK — a real backend gap found and fixed here too

Built `api/pk.ts` and a `PkPanel` component (shown in `GoLiveScreen`'s
live overlay, top-right, next to the session title) covering the actual
challenge → accept → live scoreboard → settled flow.

**Real backend gap found while building this**: `PkController` had
`challenge`/`accept`/`activate`/`settle`/`get`, but **no way for a
challenged user to ever discover the challenge existed** — `challenge()`
doesn't fire a notification, and there was no list endpoint at all.
`accept()` requires already knowing the battle id, which nothing gave
the opponent. Added `PkService.incomingChallenges()` and
`GET /pk/incoming` to close this — and had to declare that route
*before* the existing `@Get(':id')` wildcard in the controller, since
NestJS matches routes in declaration order and `:id` would otherwise
swallow `/pk/incoming` as if `"incoming"` were a battle id.

**What's honestly not real**: the reference app's Random PK, Team PK, and
the matching-odds wheel aren't backed by anything on the backend — there
is no matchmaking queue, only "challenge this specific known user."
`PkPanel` only builds the "Friend PK" shape: pick a currently-live host
from `GET /feed/live-now` and challenge them directly. The battle
scoreboard polls `GET /pk/:id` every 3s while active, stops polling and
auto-clears itself 6 seconds after the battle reaches `SETTLED`.

## New files this session

- `src/live/useAgoraEngine.ts`, `src/components/AgoraVideoView.tsx`
- `src/components/PkPanel.tsx`, `src/api/pk.ts`
- `eas.json` (development/preview/production build profiles)

## Files changed this session

- `app.json` — camera/mic permissions, `expo-dev-client` plugin,
  `agoraAppId` placeholder
- `src/config.ts` — exports `AGORA_APP_ID`
- `src/api/live.ts` — `LiveSessionRaw` gained the missing `providerChannel`
- `src/screens/live/GoLiveScreen.tsx` — real local video, mic mute
  toggle, PK panel
- `src/screens/live/LiveViewerScreen.tsx` — real remote video, replacing
  the previous session's honest "needs a dev build" placeholder

## Verification status

`npx tsc --noEmit` clean on mobile — zero errors. Every new icon name
(`flash`, `flash-outline`, `mic`, `mic-off`) checked against the actual
installed `@expo/vector-icons` glyph map, same discipline as every icon
added across this whole project. Backend: the only remaining errors are
the same familiar stale-generated-Prisma-client issue as always
(`npx prisma generate` fixes it instantly wherever you have real network
access) — checked specifically that nothing new snuck into `pk.*` beyond
that one known pattern.

---

# Follow-up: real chat wired in, and an honest note on visual design

## Chat was a real, valid gap — now fixed

Neither `GoLiveScreen` nor `LiveViewerScreen` had any chat at all, despite
the backend's WebSocket chat gateway (`realtime.gateway.ts`) being fully
built since much earlier in this project — `join`/`leave`/`chat:send`
events, rate limiting, ban/mute checks, all real and tested. Nothing on
the mobile side had ever connected to it.

Added:
- `src/live/useLiveChat.ts` — a real `socket.io-client` connection (matched
  to the backend's exact installed major version, v4, since client/server
  major versions must agree) authenticating via the same JWT access token
  used for REST calls, joining the room, sending/receiving real messages.
- `src/components/LiveChatFeed.tsx` — the actual scrolling feed + input,
  wired into both `GoLiveScreen` and `LiveViewerScreen`.
- `getAccessToken()` added to `api/client.ts` (previously only had a
  setter) and `SOCKET_BASE_URL` added to `config.ts`, derived from
  `API_BASE_URL` rather than a second hand-maintained value that could
  drift out of sync.

**One honest limitation, not papered over**: the gateway's `chat:message`
event only ever includes `senderId`, never a display name. There's no
per-message user-lookup cache built here — messages show "You" for
yourself and a shortened id for everyone else. A real name would need a
small id→displayName cache, a reasonable next step, not done in this pass.

**Did not add a "send gift" button to the host's own screen.** Reasoned
through this rather than defaulting to matching the reference screenshots
literally: in a solo broadcast (no PK opponent, no co-host), there's no
sensible recipient for the host to gift — `GiftService.send()` already
rejects self-gifts. Gifting stays exactly where it already made sense:
viewers gifting the host, in `LiveViewerScreen`.

## On "make it look 3D like Poppo/Bigo"

Applied real depth to the two most directly-called-out elements — the
Gift/Games icon circles in `LiveViewerScreen`'s action bar now use actual
`LinearGradient` fills plus the existing `glow` shadow system (colored
drop shadows, not flat circles) instead of solid `backgroundColor`.

**What I can't do, and want to be upfront about rather than fake**: the
reference apps' icons are custom illustrated art (the gift "Queen Trophy"
statue, the ornate PK medal, the gold coin bag) — genuine graphic design
assets, not something achievable through code/styling alone. I have no
image-generation capability available in this environment to produce
custom icon art. What I *can* do — and did here — is push the existing
gradient/shadow/elevation system further across more components
(buttons, badges, cards) to close some of the visual gap through styling
alone. That's a real, continuable next step if you want more of it; fully
matching the reference's hand-illustrated icon set is not something
achievable through this path at all — that would need an actual
designer or a licensed icon/asset pack.

## Verification status

`npx tsc --noEmit` clean. `send` icon checked against the real installed
glyph map. `socket.io-client@4.8.3` deliberately matched to the backend's
installed `socket.io@^4.7.5` (both major version 4) — mismatched majors
between socket.io client/server are a common, confusing source of
silent connection failures. As always: never run on a device from this
environment: the real test is yours.

---

# Follow-up: closing more of the reference-screenshot gap with real data

Direct response to being shown `live_session.jpg` again and asked "can't
you make it look like this" — this pass builds toward that specific
screenshot's structure using only real data, rather than more incremental
styling tweaks.

## A real backend bug found: gifts never broadcast at all

`RealtimeGateway.broadcastGift()` existed and was fully implemented —
but **nothing anywhere in the codebase ever called it**. A gift could be
sent successfully and no one in the room would ever see it happen in
real time, despite the broadcast plumbing being there. Fixed in
`GiftController.send()`: after a successful send (with a real
`context`/`contextId`, i.e. actually tied to a live room), it now calls
`realtime.broadcastGift()` with `{senderId, recipientId, giftId,
coinAmount}`. Required wiring `RealtimeModule` into `EconomyModule`,
which wasn't imported there before.

## New, backed by real data

- **`LiveHeaderBar`** (`components/LiveHeaderBar.tsx`): host avatar,
  name, a real elapsed-live-time counter (computed from
  `session.startedAt`), and a real Follow/Following toggle
  (`POST`/`DELETE /social/follow/:userId` — these endpoints existed,
  nothing on mobile called them before this). On the host's own screen,
  the close button now asks for confirmation before ending the session —
  it was previously going to end live broadcasting on a single accidental
  tap, right next to the existing dedicated "End live session" button.
- **`GiftTicker`** (`components/GiftTicker.tsx`): shows the most recent
  real `gift:sent` event with a brief fade — only possible now that
  gifts actually broadcast at all (see above).
- **Chat messages now have gradient badge treatment** instead of plain
  text — a real, if modest, step toward the reference's colorful
  username styling, using the existing gradient/glow system rather than
  custom art.
- **Refactored `useLiveChat`** to also surface `gift:sent` events
  alongside chat messages, and **lifted the hook up** from
  `LiveChatFeed` into the parent screens (`GoLiveScreen`/
  `LiveViewerScreen`) — both the chat feed and the new gift ticker need
  data from the same socket connection, and each component calling the
  hook independently would have opened two separate connections to the
  same room.

## Deliberately NOT built, and why

- **"Hour 100+" streak badge, percentage/level indicators**: these need
  a hosting-hours/leveling system that doesn't exist on the backend at
  all. A fabricated number here would look exactly as real as the
  correct elapsed-time counter next to it — decided against building
  anything that could be mistaken for real data when it isn't.
- **"Join my fans club" pill, "Team" squad badge**: Fan Club and Team/Squad
  features don't exist on the backend. Omitted rather than built as an
  inert decorative button.
- **Left-side All/Room/Chat vertical tabs, the wheel/lucky icon, the
  diamond icon**: no backing feature for the wheel or diamond (no Lucky
  Wheel game exists yet), and the All/Room/Chat split doesn't map to
  anything this app's single chat context currently differentiates.
- **The actual custom icon art and gift-burst animations**: still the
  one thing genuinely outside what's achievable through code/styling —
  see the previous README section on Lottie/icon-pack options.

## Verification status

`npx tsc --noEmit` clean on mobile. New icon names (`checkmark`, `add`,
`close`) verified against the real glyph map. Backend: only the same
familiar stale-Prisma-client baseline errors remain in the files I
touched — checked specifically, nothing new.

---

# Follow-up: wiring up three real screens that sat completely unreachable

Asked to "work on the profile menu screen" — investigated the existing
`ProfileScreen` first rather than assuming it needed to be built from
scratch, since a prior session had already built it out extensively
(matching the reference "Me" screen closely: profile card, stats row,
wallet cards, the Reward/Rank/Store/... grid, Streamer/Creator/Builder
Center rows, Help/Watch History/Bag/Agency/Authentication rows).

## What was found: real, fully-built screens with no way to reach them

`AgencyScreen`, `AuthenticationScreen`, and `FollowListScreen` all
existed as complete, real screens — `AgencyScreen` backed by
`GET /agencies/me`, `AuthenticationScreen` reading real
`user.kycVerified` status, `FollowListScreen` backed by the real
`GET /social/following`/`GET /social/followers` endpoints — all
registered correctly in `AppStack.tsx`'s navigator. But **nothing
anywhere in the app actually navigated to any of them**. `ProfileScreen`'s
"My Agency" and "Authentication" rows called `notImplemented()` (a fake
"coming soon" alert) instead of `navigation.navigate(...)`, and the
Following/Followers stat cells weren't tappable at all.

Did a full sweep afterward to confirm nothing else is in this state:
every `.tsx` file under `src/screens` now has at least one real
`navigate()` call reaching it somewhere in the app. None left orphaned.

## Fixed

- `gridItems`'s `rank` entry now navigates to `HonorRanking` instead of
  showing a fake alert
- `centerRows`'s... actually `accountRows`'s `agency` and `auth` entries
  now navigate to `Agency` and `Authentication` respectively
- `StatCell` gained an optional `onPress` — Following/Followers now push
  into `FollowList` with the correct `mode` param; Friends/Visitors stay
  non-interactive (correctly — neither concept exists on the backend)

## What's still honestly `notImplemented()`, and why

Reward, Store, Invite, Guardian, Fan Club, Streamer Center, Video
Creator Center, Builder Center, Help Center, Watch History, Level,
Achievement Poster, Bag, Follow Us — none of these have a real screen or
backend feature anywhere in either project. Verified this by checking,
not assuming — no matching screen file exists, and no backend endpoint
backs any of them. Left as the honest "not implemented" alert rather
than routed to something that doesn't actually serve that feature.

## Verification status

`npx tsc --noEmit` clean. Confirmed by direct sweep (not assumption) that
every screen file in the project is now reachable via at least one real
`navigate()` call.

---

# Follow-up: unified PK/Gift/Games/Settings bar, and a real Settings/Tools sheet

Direct response to being told the bottom bar should be PK, Gift, Games,
and Settings together as one consistent row — not PK floating separately
at the top (which is what I'd built) and Settings not existing at all.

## What changed

- **Both screens now have the same four-icon pattern**: `LiveViewerScreen`
  gained PK (was missing entirely) and Settings; `GoLiveScreen`'s PK moved
  out of a separate floating top-right panel into the same bottom row as
  Mic/Games/Settings.
- **`LiveToolsSheet`** (new): matches the reference's Host Tools / Basic
  Tools / Features Center menu structurally (three sections, same rough
  item count), but only wires what's genuinely real:
  - **Switch Camera** and **Noise Reduction** — actual Agora SDK calls
    (`switchCamera()`, `setAINSMode()`), verified against the installed
    package's real type definitions before use, same discipline as
    `useAgoraEngine.ts` itself. Host-only, since a viewer's device has no
    publishing camera/mic to affect.
  - **Share** — React Native's real native share sheet, not a fake button.
  - **Rank** — opens the already-built `HonorRanking` screen.
  - Everything else in the reference menu (Admins, Fan Club, Live Data,
    Beauty, Rewards, Store, VIP, Bag, Gift Gallery, Lucky Box, Gift
    Collection, Gift Wish...) has no backend feature or SDK capability
    behind it at all — routed through the same `notImplemented()` alert
    used in Profile.
- **Extracted `notImplemented()`** into `src/utils/notImplemented.ts` —
  it was a local function inside `ProfileScreen.tsx`; `LiveToolsSheet`
  needed the exact same pattern, so this is now shared rather than
  duplicated with a slightly different message each place.
- **No Gift button on the host's own screen, still** — same reasoning as
  before, unchanged: a solo host has no sensible gift recipient
  (`GiftService.send()` already rejects self-gifts). Games is present on
  the host's own bar for layout consistency but currently shows an
  honest "not available during your own live session" message — actually
  *playing* a game while also hosting raises real UX questions (can you
  see the game board and your camera at once?) that weren't resolved
  here, so it's left as a placeholder rather than guessed at.

## Verification status

`npx tsc --noEmit` clean. All 22 new icon names used in `LiveToolsSheet`
verified in one bulk pass against the actual installed
`@expo/vector-icons` glyph map file — not spot-checked individually,
every single one confirmed present before use.

---

# Follow-up: a real "can't end live" bug fixed, decluttering, and a proper FB/IG-style chat

## Real bug found and fixed: ending a live session could fail completely silently

`endMutation` (in `GoLiveScreen`) had no `onError` handler at all. If
`endLiveSession()` failed for any reason — network blip, the backend
rejecting it, the session already having ended some other way — tapping
"End session" in the confirmation dialog would just... do nothing.
No error, no feedback, the screen stays exactly as it was. This matches
"I can't end the live" exactly. Fixed with a real `Alert.alert` showing
the actual error. Found the identical gap in `LiveHeaderBar`'s
follow/unfollow mutation while checking for the same pattern elsewhere —
fixed that too, same reasoning: an unresponsive follow button is exactly
as confusing as an unresponsive end-session button.

## Decluttered the action bars

- Icon circles shrunk from 44-52px down to 36px across both `GoLiveScreen`
  and `LiveViewerScreen`, plus `PkPanel`'s own button — they were too
  large relative to the rest of the UI.
- **Mic moved out of the main action row into the Settings/Tools sheet**
  (`LiveToolsSheet`'s Basic Tools section, alongside Switch Camera and
  Noise Reduction) — not removed, just relocated. The primary row is now
  PK / Games / Settings on the host's screen, matching the request to
  simplify what's immediately visible.

## Chat redesigned to match Facebook/Instagram Live, not a boxed chat app

Previously: a distinct panel with a visible background color behind the
whole feed, colorful gradient sender badges, a bordered input box — read
as "a chat window sitting on top of the video," not an ambient overlay.

Now: each comment is its own small translucent dark pill floating
directly on the video (`rgba(0,0,0,0.38)`, not a solid panel), name and
message on one compact line ("You  message text"), no background behind
the list itself, and a minimal translucent input pill instead of a
bordered box. The send button only appears once there's actually
something typed, rather than sitting there disabled. This is the same
structural pattern real FB/IG Live comments use — individual floating
elements, not a boxed panel.

## Two things intentionally NOT touched yet — need more from you first

**"The live screen is blank, nothing showing"** — I don't have enough
information to diagnose this blind. Is this the video area specifically
(which would normally show the "Connecting camera..."/"Waiting for host
video..." placeholder text — if you're seeing literally nothing, not
even that text, something is actually broken, not just video failing to
render), or the whole screen? A screenshot is the fastest way to know
for certain, same as every other bug in this whole project.

**"Solo or invite people"** — this reads as wanting multi-host/guest live
sessions (like Instagram Live's "add guest" feature), which is a real,
substantial feature — the current backend's `LiveSession` model has
exactly one `hostId`, no concept of a second broadcaster joining the same
session. Building this properly needs a scoping conversation (does
"invite" mean another person also publishes video into the same channel,
or just something lighter like inviting someone to watch?) and likely
real backend schema work, not something to guess at and build blind.

## Verification status

`npx tsc --noEmit` clean. Two new icon names (`mic-outline`,
`mic-off-outline`) verified against the real glyph map before use.

---

# Follow-up: the real layout bug behind "no End Live button"

## Found it: the chat feed was silently covering the button

`actionRow` (bottom: 190), `endButtonWrap` (bottom: 140), and `chatWrap`
(bottom: 0, no height cap) were three independently absolutely-positioned
elements with guessed pixel offsets — and `chatWrap` rendered last, so
in React Native's stacking order it sat on top of both the others.
The "End live session" button was never actually missing from the code;
it was being visually covered by the transparent-background chat feed
sitting directly over it. Classic silent stacking bug, not a rendering
failure.

**Fixed properly, not with another guessed offset**: replaced the three
separate absolutely-positioned pieces with one `bottomStack` container
(a single flex column anchored to the bottom) holding the action row,
the End Live button, then the chat feed in that order — they now stack
naturally based on their actual rendered height instead of three
independent magic numbers that happened to overlap.

## The close (X) button no longer ends your broadcast

It was wired to the same "End live session?" confirmation as the
dedicated button — meaning there were two different-looking controls
that both did the same destructive thing, and tapping what looks like a
plain dismiss button unexpectedly asked to end your stream. Now it just
navigates to the Home tab and leaves the broadcast running. **Ending a
live session has exactly one path now**: the dedicated "End live
session" button, which is also the one now properly visible.

## Verification status

`npx tsc --noEmit` clean.

---

# Follow-up: the orphaned-live-session bug, and a full real-data Lucky Number redesign

## The orphaned live session bug

Last session's fix made the X button just navigate away instead of
ending the broadcast — which fixed the annoying confirmation dialog, but
created a worse problem: there's no "minimize and keep streaming in the
background" feature built. The Agora engine tears down the moment
`GoLiveScreen` loses focus. So closing the screen stopped the actual
video/audio, but the backend session stayed marked `LIVE` forever — an
orphaned session showing on Home's live-now list with nothing behind it
and no way back to it.

Fixed properly: closing this screen — **either** via the X button or by
tapping a different tab directly — now always ends the session on the
backend too, via a single `navigation.addListener('blur', ...)` handler
that covers both paths in one place (rather than two separate code paths
that could both fire and double-call `endLiveSession` for the same
close). No confirmation dialog, since ending is no longer optional —
there was never a real way to leave without stopping the broadcast, so
asking twice was just friction.

## Lucky Number — a real screenshot from the actual app, wired to real data

You sent an actual screenshot of Poppo Live's Lucky Number game and asked
for a redesign matching it. This turned out to be exactly the same
per-number pool feature I'd flagged as "backend endpoint exists, never
displayed" in an earlier README — that small coin figure under each
number in your screenshot is real staked-amount data that was already
available and just never shown.

Full rewrite of `SumDiceScreen.tsx`, still against every real endpoint:

- **A `Tile` component** — the gold gradient 3D-tile treatment from the
  reference, reused for both spelling "LUCKY" and for the three drawn
  result digits (rolls/shuffles while the round is between LOCKED and
  SETTLED, shows the real drawn dice once available).
- **Real per-number pool** displayed as a small subscript under each grid
  cell (`GET rounds/:id/pool`) — genuinely how much everyone has staked
  on that number, not decoration.
- **Real win banner** — only shows, and only shows a real prize amount,
  when `GET rounds/:id/entries/mine` confirms your own entry actually won.
- **Real recent-streak text** and **real recent-results strip** —
  computed from `GET :gameCode/stats` and `GET :gameCode/history`, not
  hardcoded arrays.
- **Real wallet balance** in the header, real bet placement via
  `POST rounds/:id/entries`, and the S/B/E/O quick-select shortcuts
  preserved from the previous version (client-side convenience only —
  the backend only ever sees the resulting number array, same as before).

Not an exact pixel match to the screenshot — the "LUCKY"/"NUMBER!"
lettering, glow placement, and exact spacing are approximations built
from styled text and gradients, not the actual illustrated asset from
the reference (same limitation as always: no image-generation capability
in this environment to produce real custom art). But the structure,
mechanic, and real-vs-fake data boundary should now match what you asked
for.

## Verification status

`npx tsc --noEmit` clean. All icon names used verified against the real
installed glyph map.

---

# Follow-up: your own live session opened as a read-only viewer with no way to end it

## The bug

`HomeScreen`'s live-now cards always navigated to `LiveViewer` regardless
of whose session it was. `LiveViewerScreen` deliberately has no host
controls at all — no End Live button, no ability to stop the broadcast —
since a viewer should never be able to end someone else's stream. But
nothing checked whether the tapped session was actually the current
user's *own* broadcast. Tap your own live card from Home while
broadcasting, and you'd land on a screen with genuinely no way to stop
it short of force-closing the app.

## The fix

`HomeScreen` now imports `useAuth` (it didn't before — a real gap on its
own) and checks `session.hostId === user?.id` before navigating. Your
own session routes to the real `GoLive` tab (with its working End Live
button and this session's earlier orphaned-session fix); anyone else's
session still opens the normal read-only `LiveViewer`.

## Verification status

`npx tsc --noEmit` clean.

---

# Follow-up: a genuinely orphaned session with no way to discover or clear it

## The actual root cause of "already have an active session"

This was real, live proof of the exact risk flagged in earlier sessions:
a session from before the orphaned-session fixes existed had been left
marked `LIVE` in the database, with `GoLiveScreen` having zero way to
know it existed — its local `session` state only ever gets populated by
this exact app session's own `createLiveSession()` call. Reopen the app,
or hit this from a different path, and the screen shows the plain
"create new" form — which then fails with `create()`'s own
"you already have an active or scheduled live session" rejection, a
correct check with no way to act on it.

## Fixed on both sides

- **Backend**: `LiveService.findMine()` / `GET /live/mine` — didn't exist
  at all. `create()`'s rejection proved the record was always
  discoverable server-side; nothing ever exposed it to the client that
  actually needed to see it.
- **Mobile**: `GoLiveScreen` now checks for an existing session on mount.
  If one is found that this screen's local state doesn't know about, it
  shows a specific "You have an existing live session — end it" screen
  rather than either the blank create-form or a fake attempt at full
  video controls. Deliberately does **not** try to resume broadcasting on
  the old session with video — that would need a separate host-token
  reissue endpoint (the existing join endpoint only ever issues
  audience-role tokens, even for the host) that wasn't built in this
  pass. Ending it is the actual blocker this needed to solve.

## Verification status

`npx tsc --noEmit` clean on both projects (backend's only remaining
errors are the same familiar stale-Prisma-client baseline, confirmed
nothing new).
