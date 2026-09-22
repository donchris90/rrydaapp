import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { createRoom } from '../../../api/rooms';
import { PreRoomScreen, type RoomCreationConfig } from './PreRoomScreen';
import type { AppStackParamList } from '../../../navigation/types';

export function PartyPreLiveScreen({ initialMode = 'video', initialThemeColor }: { initialMode?: 'video' | 'voice'; initialThemeColor?: string } = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const createMutation = useMutation({
    mutationFn: (config: RoomCreationConfig) => createRoom({
      title: config.title,
      category: config.category,
      seatCount: config.seatCount,
      privacy: config.privacy,
      themeColor: initialThemeColor,
    }),
    onSuccess: (room, config) => navigation.navigate('PartyLive', { roomId: room.id, mode: config.mode }),
    onError: (error: any) => Alert.alert('Could not start party', error?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <PreRoomScreen
      initialMode={initialMode}
      onGoBack={() => navigation.navigate('MainTabs', { screen: 'Live' })}
      onStartRoom={(config) => createMutation.mutate(config)}
      isStarting={createMutation.isPending}
    />
  );
}
