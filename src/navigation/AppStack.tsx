import { VideoCameraScreen } from '../screens/video/VideoCameraScreen';
import { VideoEditorScreen } from '../screens/video/VideoEditorScreen';
import { VideoPublishScreen } from '../screens/video/VideoPublishScreen';
import { VideoSearchScreen } from '../screens/video/VideoSearchScreen';
import { PkChallengeBanner } from '../components/PkChallengeBanner';
import { ProfileSheetProvider } from '../context/ProfileSheetContext';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AppStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { GameCenterScreen } from '../screens/game/GameCenterScreen';
import { SumDiceScreen } from '../screens/game/SumDiceScreen';
import { SearchScreen } from '../screens/search/SearchScreen';
import { FollowListScreen } from '../screens/social/FollowListScreen';
import { HonorRankingScreen } from '../screens/social/HonorRankingScreen';
import { AgencyScreen } from '../screens/agency/AgencyScreen';
import { AuthenticationScreen } from '../screens/authentication/AuthenticationScreen';
import { LiveViewerScreen } from '../screens/live/LiveViewerScreen';
import { PkScreen } from '../screens/pk/PkScreen';
import { BuyCoinsScreen } from '../screens/economy/BuyCoinsScreen';
import { CreatorCenterScreen } from '../screens/creators/CreatorCenterScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { HelpCenterScreen } from '../screens/profile/HelpCenterScreen';
import { InviteScreen } from '../screens/profile/InviteScreen';
import { BagScreen } from '../screens/profile/BagScreen';
import { WatchHistoryScreen } from '../screens/profile/WatchHistoryScreen';
import { RewardScreen } from '../screens/profile/RewardScreen';
import { RoomScreen } from '../screens/party/RoomScreen';
import { PreRoomScreen } from '../screens/party/PreRoomScreen';
import { PayoutAccountScreen } from '../screens/payout/PayoutAccountScreen';
import { CrashScreen } from '../screens/game/CrashScreen';
import { ConversationScreen } from '../screens/inbox/ConversationScreen';
import { CallScreen } from '../screens/calls/CallScreen';
import { LiveFormatPickerScreen } from '../screens/live/LiveFormatPickerScreen';
import { GoLiveScreen } from '../screens/live/GoLiveScreen';
import { BlockedUsersScreen } from '../screens/profile/BlockedUsersScreen';
import { VideoFeedScreen } from '../screens/video/VideoFeedScreen';
import { VideoCreatorCenterScreen } from '../screens/profile/VideoCreatorCenterScreen';
import { PkHistoryScreen } from '../screens/pk/PkHistoryScreen';
import { IncomingCallOverlay } from '../components/IncomingCallOverlay';
import { PushNotificationHost } from '../components/PushNotificationHost';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <ProfileSheetProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgDeepest },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      {/* headerShown: false — the redesigned hub renders its own title row
          (plus a live wallet chip next to it), matching the web reference's
          hub screen, which has no separate native-style title bar either. */}
      <Stack.Screen name="GameCenter" component={GameCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SumDice" component={SumDiceScreen} options={{ title: 'Lucky Number' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search', headerShown: false }} />
      <Stack.Screen name="FollowList" component={FollowListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HonorRanking" component={HonorRankingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Agency" component={AgencyScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Authentication" component={AuthenticationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LiveViewer" component={LiveViewerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PkScreen" component={PkScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BuyCoins" component={BuyCoinsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreatorCenter" component={CreatorCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Invite" component={InviteScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Bag" component={BagScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WatchHistory" component={WatchHistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PayoutAccount" component={PayoutAccountScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Reward" component={RewardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Room" component={RoomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PreRoom" component={PreRoomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CrashGame" component={CrashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="LiveFormatPicker" component={LiveFormatPickerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GoLive" component={GoLiveScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoFeed" component={VideoFeedScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoSearch" component={VideoSearchScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoCamera" component={VideoCameraScreen} options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="VideoEditor" component={VideoEditorScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoPublish" component={VideoPublishScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VideoCreatorCenter" component={VideoCreatorCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PkHistory" component={PkHistoryScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
      <IncomingCallOverlay />
      <PushNotificationHost />
      {/* A PK challenge appears on screen wherever you are. */}
      <PkChallengeBanner />
    </ProfileSheetProvider>
  );
}