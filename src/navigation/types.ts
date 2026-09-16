export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Party: undefined;
  GoLive: undefined;
  Inbox: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
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
  PreRoom: undefined;
  CrashGame: undefined;
};