import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PartyScreen } from '../screens/party/PartyScreen';
import { ExploreScreen } from '../screens/explore/ExploreScreen';
import { InboxScreen } from '../screens/inbox/InboxScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AnimatedTabBar } from '../components/AnimatedTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Rryda's five primary destinations, matching the Poppo/Bigo redesign:
 * Live, Party, Explore, Message and Profile.
 */
export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Live" component={HomeScreen} options={{ title: 'Live' }} />
      <Tab.Screen name="Party" component={PartyScreen} options={{ title: 'Party' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: 'Explore' }} />
      <Tab.Screen name="Message" component={InboxScreen} options={{ title: 'Message' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
