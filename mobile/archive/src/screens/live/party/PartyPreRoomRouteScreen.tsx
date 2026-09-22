import React from 'react';
import { useRoute, type RouteProp } from '@react-navigation/native';
import type { AppStackParamList } from '../../../navigation/types';
import { PartyPreLiveScreen } from './PartyPreLiveScreen';

export function PartyPreRoomRouteScreen() {
  const route = useRoute<RouteProp<AppStackParamList, 'PreRoom'>>();
  return <PartyPreLiveScreen initialMode={route.params?.initialMode ?? 'video'} initialThemeColor={route.params?.initialThemeColor} />;
}
