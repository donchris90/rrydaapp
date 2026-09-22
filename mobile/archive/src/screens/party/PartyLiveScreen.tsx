import React from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PartyAudioLiveScreen } from '../../party-live/screens/PartyAudioLiveScreen';
import type { AppStackParamList } from '../../navigation/types';

export function PartyLiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PartyLive'>>();

  return (
    <PartyAudioLiveScreen
      initialMode={route.params.mode}
      initialTitle={route.params.title}
      initialSeatCount={route.params.seatCount}
      initialCameraEnabled={route.params.isCameraEnabled}
      initialBeauty={route.params.beauty}
      onLeaveRoom={() => navigation.navigate('MainTabs', { screen: 'Live' })}
    />
  );
}
