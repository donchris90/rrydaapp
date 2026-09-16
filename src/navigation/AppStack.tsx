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
import { CrashScreen } from '../screens/game/CrashScreen';
import { ConversationScreen } from '../screens/inbox/ConversationScreen';
import { CallScreen } from '../screens/calls/CallScreen';
import { IncomingCallOverlay } from '../components/IncomingCallOverlay';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgDeepest },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="GameCenter" component={GameCenterScreen} options={{ title: 'Game Center' }} />
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
      <Stack.Screen name="Reward" component={RewardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Room" component={RoomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PreRoom" component={PreRoomScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CrashGame" component={CrashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Conversation" component={ConversationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
      <IncomingCallOverlay />
    </>
  );
}