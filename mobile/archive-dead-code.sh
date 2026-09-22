#!/usr/bin/env bash
# Moves code that the native app can never reach into ./archive/, keeping each
# file's path so anything can be restored with one `git mv`.
#
# Run from the mobile app's root (the folder holding App.tsx). Uses `git mv`
# inside a git repo (history preserved), plain `mv` otherwise. Safe to re-run:
# files that are already gone are skipped.
#
# How the list was made: every file reachable from App.tsx by static import
# (Metro needs static imports, so this is exactly what can be bundled) was
# collected; the files below are the ones that are not. See ARCHIVE_MANIFEST.md.
set -euo pipefail

if [ ! -f App.tsx ] || [ ! -d src ]; then
  echo "Run this from the mobile app root (the folder containing App.tsx and src/)." >&2
  exit 1
fi

# `git mv` only works on files git is tracking. Your project folder can sit inside a
# git repository (a parent folder) while these files are not added to it, which made
# the old version stop with "not under version control". So: use `git mv` for a file
# git tracks (history kept), and a plain `mv` for any other.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then USE_GIT=1; else USE_GIT=0; fi

move_file() {
  if [ "$USE_GIT" = 1 ] && git ls-files --error-unmatch -- "$1" >/dev/null 2>&1; then
    git mv -- "$1" "archive/$1"
  else
    mv -- "$1" "archive/$1"
  fi
}

FILES=(
  "CrashScreen.native.tsx"
  "mobile/CrashScreen.tsx"
  "mobile/src/screens/game/CrashScreen.tsx"
  "src/App.tsx"
  "src/CrashScreen.native.tsx"
  "src/CrashScreen.tsx"
  "src/api/imgbb.ts"
  "src/components/ActiveLiveView.tsx"
  "src/components/BettingControls.tsx"
  "src/components/CrashCanvas.tsx"
  "src/components/CrashHeader.tsx"
  "src/components/ExpoCodeViewer.tsx"
  "src/components/FairnessModal.tsx"
  "src/components/GiftAnimationOverlay.tsx"
  "src/components/GiftModal.tsx"
  "src/components/HelpModal.tsx"
  "src/components/HistoryRibbon.tsx"
  "src/components/Icon3D.tsx"
  "src/components/LiveBetsTable.tsx"
  "src/components/LiveChat.tsx"
  "src/components/LiveHeader.tsx"
  "src/components/PhoneFrame.tsx"
  "src/components/PkBattleBar.tsx"
  "src/components/PkPanel.tsx"
  "src/components/PoppoQuickHub.tsx"
  "src/components/PreLiveView.tsx"
  "src/components/PromoBannerRow.tsx"
  "src/components/RoundLeaderboard.tsx"
  "src/components/SimModals.tsx"
  "src/components/TrendsModal.tsx"
  "src/components/UserStatsDashboard.tsx"
  "src/components/hub/HubHeader.tsx"
  "src/components/hub/LiveWinsTicker.tsx"
  "src/components/hub/TopPlayersLeaderboard.tsx"
  "src/components/live/BeautySheet.tsx"
  "src/components/live/LiveToolsSheet.tsx"
  "src/components/profile/BackpackModal.tsx"
  "src/components/profile/EditProfileModal.tsx"
  "src/components/profile/FollowersModal.tsx"
  "src/components/profile/GenericInfoModal.tsx"
  "src/components/profile/ImageCropModal.tsx"
  "src/components/profile/NavTabButton.tsx"
  "src/components/profile/ProfileSkeleton.tsx"
  "src/components/profile/ReportUserModal.tsx"
  "src/components/profile/TopUpModal.tsx"
  "src/components/profile/UserBadges.tsx"
  "src/components/profile/VipDetailsModal.tsx"
  "src/components/profile/VipPrivilegeBanner.tsx"
  "src/components/profile/VipProgressBar.tsx"
  "src/components/profile/WithdrawModal.tsx"
  "src/context/ProfileContext.tsx"
  "src/data.ts"
  "src/expo-source/GoLiveScreen.tsx"
  "src/expo-source/components/BeautySheet.tsx"
  "src/expo-source/components/FloatingHearts.tsx"
  "src/expo-source/components/LiveChatOverlay.tsx"
  "src/expo-source/components/LiveHeader.tsx"
  "src/expo-source/components/LiveToolsSheet.tsx"
  "src/expo-source/components/PkBattleOverlay.tsx"
  "src/expo-source/components/StreamSummaryModal.tsx"
  "src/expoCodeExport.ts"
  "src/main.tsx"
  "src/navigation/GameStack.tsx"
  "src/party-live/components/AudioBattlePkBar.tsx"
  "src/party-live/components/AudioSeatGrid.tsx"
  "src/party-live/components/BeautyFilterSheet.tsx"
  "src/party-live/components/GiftSheet.tsx"
  "src/party-live/components/PartyThemePicker.tsx"
  "src/party-live/components/SeatManagementSheet.tsx"
  "src/party-live/components/SofaIcon.tsx"
  "src/party-live/components/SoundboardModal.tsx"
  "src/party-live/index.ts"
  "src/party-live/screens/PartyAudioLiveScreen.tsx"
  "src/party-live/screens/PartyScreen.tsx"
  "src/party-live/screens/PreRoomScreen.tsx"
  "src/party-live/theme.ts"
  "src/screen/profile/ProfileScreen.tsx"
  "src/screen/profile/index.ts"
  "src/screens/game/GameScreen.tsx"
  "src/screens/live/LiveScreen.tsx"
  "src/screens/live/party/PartyAudioLiveScreen.tsx"
  "src/screens/live/party/PartyLiveScreen.tsx"
  "src/screens/live/party/PartyPreLiveScreen.tsx"
  "src/screens/live/party/PartyPreRoomRouteScreen.tsx"
  "src/screens/live/party/PreRoomScreen.tsx"
  "src/screens/live/party/components/AudioBattlePkBar.tsx"
  "src/screens/live/party/components/AudioSeatGrid.tsx"
  "src/screens/live/party/components/BeautyFilterSheet.tsx"
  "src/screens/live/party/components/GiftSheet.tsx"
  "src/screens/live/party/components/PartyThemePicker.tsx"
  "src/screens/live/party/components/SeatManagementSheet.tsx"
  "src/screens/live/party/components/SofaIcon.tsx"
  "src/screens/live/party/components/SoundboardModal.tsx"
  "src/screens/live/party/index.ts"
  "src/screens/live/party/theme.ts"
  "src/screens/party/PartyLiveScreen.tsx"
  "src/screens/party/PartyPreLiveScreen.tsx"
  "src/screens/profile/BuilderCenterScreen.tsx"
  "src/screens/profile/ProfileScreen.old.tsx"
  "src/screens/profile/index.ts"
  "src/types.ts"
  "src/types/profile.ts"
  "src/types/translations.ts"
  "src/utils/audio.ts"
  "src/utils/audioEffects.ts"
  "src/utils/dashboardHistory.ts"
  "src/utils/haptics.ts"
  "src/utils/notImplemented.ts"
  "src/utils/provablyFair.ts"
  "src/components/live/PkBattleOverlay.tsx"
  "src/components/QuickReactionBar.tsx"
)

moved=0
for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    mkdir -p "archive/$(dirname "$f")"
    move_file "$f"
    moved=$((moved + 1))
  fi
done

# Remove directories the moves left empty (never touches non-empty ones).
find src mobile -type d -empty -delete 2>/dev/null || true

echo "Archived $moved files into ./archive/"
