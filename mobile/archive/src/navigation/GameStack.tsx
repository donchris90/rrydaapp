import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { GameStackParamList } from './types';
import { GameCenterScreen } from '../screens/game/GameCenterScreen';
import { SumDiceScreen } from '../screens/game/SumDiceScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<GameStackParamList>();

export function GameStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen name="GameCenter" component={GameCenterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SumDice" component={SumDiceScreen} options={{ title: 'Lucky Number' }} />
    </Stack.Navigator>
  );
}
