import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { GoLiveScreen } from '../screens/live/GoLiveScreen';
import { PartyScreen } from '../screens/party/PartyScreen';
import { InboxScreen } from '../screens/inbox/InboxScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnimatedTabBar } from '../components/AnimatedTabBar';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Header/tab-bar chrome now matches the rest of the app's dark palette
// instead of react-navigation's white default — the tab bar itself is
// fully custom (AnimatedTabBar) for the gradient-pill active state.
export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bgDeepest },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Party" component={PartyScreen} options={{ title: 'Party', headerShown: false }} />
      {/* Elevated middle slot — see AnimatedTabBar's GoLive special-case.
          Header hidden since GoLiveScreen draws its own centered layout. */}
      <Tab.Screen name="GoLive" component={GoLiveScreen} options={{ title: 'Go Live', headerShown: false }} />
      <Tab.Screen name="Inbox" component={InboxScreen} options={{ title: 'Inbox' }} />
      {/* headerShown: false — Profile ("Me") uses the light reference-app
          palette (see theme.ts's meColors) and draws its own header, so
          the dark native header here would clash with it. */}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerShown: false }} />
    </Tab.Navigator>
  );
}
