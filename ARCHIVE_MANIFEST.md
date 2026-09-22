# Dead-code archive manifest

`archive-dead-code.sh` moves the 109 files below into `./archive/`, keeping their paths (restore with `git mv archive/<path> <path>`).

Computed on the tree AFTER the simulation removal in this bundle: every file reachable from `App.tsx` by static import was collected; these are the ones that are not. Verified after moving them: the app's imports still resolve, `tsc --noEmit` reports 0 errors, and Metro bundles the app.

## Simulated widgets replaced by real ones in this change (9)

- `src/components/live/BeautySheet.tsx`
- `src/components/live/LiveToolsSheet.tsx`
- `src/components/profile/TopUpModal.tsx`
- `src/components/profile/UserBadges.tsx`
- `src/components/profile/VipDetailsModal.tsx`
- `src/components/profile/VipPrivilegeBanner.tsx`
- `src/components/profile/VipProgressBar.tsx`
- `src/components/profile/WithdrawModal.tsx`
- `src/utils/notImplemented.ts`

## Party-room demo screens (local simulation) and their duplicates (30)

- `src/party-live/components/AudioBattlePkBar.tsx`
- `src/party-live/components/AudioSeatGrid.tsx`
- `src/party-live/components/BeautyFilterSheet.tsx`
- `src/party-live/components/GiftSheet.tsx`
- `src/party-live/components/PartyThemePicker.tsx`
- `src/party-live/components/SeatManagementSheet.tsx`
- `src/party-live/components/SofaIcon.tsx`
- `src/party-live/components/SoundboardModal.tsx`
- `src/party-live/index.ts`
- `src/party-live/screens/PartyAudioLiveScreen.tsx`
- `src/party-live/screens/PartyScreen.tsx`
- `src/party-live/screens/PreRoomScreen.tsx`
- `src/party-live/theme.ts`
- `src/screens/live/party/PartyAudioLiveScreen.tsx`
- `src/screens/live/party/PartyLiveScreen.tsx`
- `src/screens/live/party/PartyPreLiveScreen.tsx`
- `src/screens/live/party/PartyPreRoomRouteScreen.tsx`
- `src/screens/live/party/PreRoomScreen.tsx`
- `src/screens/live/party/components/AudioBattlePkBar.tsx`
- `src/screens/live/party/components/AudioSeatGrid.tsx`
- `src/screens/live/party/components/BeautyFilterSheet.tsx`
- `src/screens/live/party/components/GiftSheet.tsx`
- `src/screens/live/party/components/PartyThemePicker.tsx`
- `src/screens/live/party/components/SeatManagementSheet.tsx`
- `src/screens/live/party/components/SofaIcon.tsx`
- `src/screens/live/party/components/SoundboardModal.tsx`
- `src/screens/live/party/index.ts`
- `src/screens/live/party/theme.ts`
- `src/screens/party/PartyLiveScreen.tsx`
- `src/screens/party/PartyPreLiveScreen.tsx`

## Web-only browser simulation (App.tsx and its components) (24)

- `src/App.tsx`
- `src/components/BettingControls.tsx`
- `src/components/CrashCanvas.tsx`
- `src/components/CrashHeader.tsx`
- `src/components/FairnessModal.tsx`
- `src/components/HelpModal.tsx`
- `src/components/HistoryRibbon.tsx`
- `src/components/LiveBetsTable.tsx`
- `src/components/RoundLeaderboard.tsx`
- `src/components/TrendsModal.tsx`
- `src/data.ts`
- `src/expo-source/GoLiveScreen.tsx`
- `src/expo-source/components/BeautySheet.tsx`
- `src/expo-source/components/FloatingHearts.tsx`
- `src/expo-source/components/LiveChatOverlay.tsx`
- `src/expo-source/components/LiveHeader.tsx`
- `src/expo-source/components/LiveToolsSheet.tsx`
- `src/expo-source/components/PkBattleOverlay.tsx`
- `src/expo-source/components/StreamSummaryModal.tsx`
- `src/expoCodeExport.ts`
- `src/main.tsx`
- `src/types.ts`
- `src/utils/audio.ts`
- `src/utils/provablyFair.ts`

## Superseded profile / creator screens (2)

- `src/screens/profile/BuilderCenterScreen.tsx`
- `src/screens/profile/ProfileScreen.old.tsx`

## Stray Crash screen copies (5)

- `CrashScreen.native.tsx`
- `mobile/CrashScreen.tsx`
- `mobile/src/screens/game/CrashScreen.tsx`
- `src/CrashScreen.native.tsx`
- `src/CrashScreen.tsx`

## Other files nothing can import (39)

- `src/api/imgbb.ts`
- `src/components/ActiveLiveView.tsx`
- `src/components/ExpoCodeViewer.tsx`
- `src/components/GiftAnimationOverlay.tsx`
- `src/components/GiftModal.tsx`
- `src/components/Icon3D.tsx`
- `src/components/LiveChat.tsx`
- `src/components/LiveHeader.tsx`
- `src/components/PhoneFrame.tsx`
- `src/components/PkBattleBar.tsx`
- `src/components/PkPanel.tsx`
- `src/components/PoppoQuickHub.tsx`
- `src/components/PreLiveView.tsx`
- `src/components/PromoBannerRow.tsx`
- `src/components/SimModals.tsx`
- `src/components/UserStatsDashboard.tsx`
- `src/components/hub/HubHeader.tsx`
- `src/components/hub/LiveWinsTicker.tsx`
- `src/components/hub/TopPlayersLeaderboard.tsx`
- `src/components/profile/BackpackModal.tsx`
- `src/components/profile/EditProfileModal.tsx`
- `src/components/profile/FollowersModal.tsx`
- `src/components/profile/GenericInfoModal.tsx`
- `src/components/profile/ImageCropModal.tsx`
- `src/components/profile/NavTabButton.tsx`
- `src/components/profile/ProfileSkeleton.tsx`
- `src/components/profile/ReportUserModal.tsx`
- `src/context/ProfileContext.tsx`
- `src/navigation/GameStack.tsx`
- `src/screen/profile/ProfileScreen.tsx`
- `src/screen/profile/index.ts`
- `src/screens/game/GameScreen.tsx`
- `src/screens/live/LiveScreen.tsx`
- `src/screens/profile/index.ts`
- `src/types/profile.ts`
- `src/types/translations.ts`
- `src/utils/audioEffects.ts`
- `src/utils/dashboardHistory.ts`
- `src/utils/haptics.ts`
