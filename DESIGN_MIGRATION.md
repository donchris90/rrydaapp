# Rryda Poppo/Bigo visual migration

This build keeps the existing mobile application's real API, authentication, Agora, sockets, navigation, wallet, live, party and game functionality while replacing the core visual language with the `rryda-live---poppo-&-bigo-redesign` direction.

## Included in this pass
- Porcelain light global design tokens: pearl background, white surfaces, hot pink/coral hero gradient, electric cyan, violet and gold accents.
- Poppo/Bigo-style Home screen with branded header, category pills, quick feature hub, promo row, country filters, two-column live/creator cards and floating Go Live action.
- Global `GradientBackground` updated to the new pearl ambient background and coordinated glow treatment.
- Bottom navigation updated to the new light/glass visual shell.
- Theme toggle added to Home and Profile and persisted with Expo SecureStore.
- Midnight theme added to the shared theme context and applied immediately to the app shell/background surfaces that consume the theme context.
- Existing backend/API and RTC logic was intentionally preserved.

## Next migration pass
The remaining feature-specific screens can be brought into the same design system without replacing their data/RTC implementations. The three prototype ZIPs should continue to be treated as UX references, not as replacement application code.
