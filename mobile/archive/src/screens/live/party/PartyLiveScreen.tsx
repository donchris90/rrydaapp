import React from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/types';
import { PartyAudioLiveScreen } from './PartyAudioLiveScreen';

export function PartyLiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PartyLive'>>();
  return <PartyAudioLiveScreen roomId={route.params.roomId} initialMode={route.params.mode} onLeaveRoom={() => navigation.navigate('MainTabs', { screen: 'Live' })} />;
}
