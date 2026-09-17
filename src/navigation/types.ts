export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Party: undefined;
  GoLive: { initialTitle?: string; initialThemeColor?: string } | undefined;
  Inbox: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList; params?: Record<string, unknown> } | undefined;
  GameCenter: undefined;
  SumDice: undefined;
  Search: undefined;
  FollowList: { mode: 'followers' | 'following'; pkChallenge?: boolean };
  HonorRanking: undefined;
  Agency: undefined;
  Authentication: undefined;
  LiveViewer: { sessionId: string };
  PkScreen: undefined;
  BuyCoins: undefined;
  CreatorCenter: undefined;
  EditProfile: undefined;
  HelpCenter: undefined;
  Invite: undefined;
  Bag: undefined;
  WatchHistory: undefined;
  Reward: undefined;
  Room: { roomId: string; initialVideoEnabled?: boolean };
  PreRoom: { initialMode?: 'video' | 'voice'; initialThemeColor?: string } | undefined;
  CrashGame: undefined;
  Conversation: { userId: string; displayName: string | null };
  Call: { callId: string; otherUserId: string; otherUserDisplayName: string | null; isIncoming: boolean };
  LiveFormatPicker: undefined;
  BlockedUsers: undefined;
};