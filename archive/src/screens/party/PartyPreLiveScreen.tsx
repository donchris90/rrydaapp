import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PreRoomScreen as PartyPreRoomScreen, type RoomCreationConfig } from '../../party-live/screens/PreRoomScreen';
import type { AppStackParamList } from '../../navigation/types';

export function PartyPreLiveScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <PartyPreRoomScreen
      onGoBack={() => navigation.navigate('MainTabs', { screen: 'Live' })}
      onStartRoom={(config: RoomCreationConfig) => {
        navigation.navigate('PartyLive', {
          mode: config.mode,
          title: config.title,
          seatCount: config.seatCount,
          isCameraEnabled: config.isCameraEnabled,
          beauty: config.beauty,
        });
      }}
    />
  );
}
