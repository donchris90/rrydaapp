export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Live: undefined;
  Party: undefined;
  Explore: undefined;
  Message: undefined;
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
  CreatorCenter: { defaultTab?: 'streamer' | 'creator' | 'tools' | 'agency' } | undefined;
  EditProfile: undefined;
  HelpCenter: undefined;
  Invite: undefined;
  Bag: undefined;
  WatchHistory: undefined;
  Reward: undefined;
  Room: { roomId: string; initialVideoEnabled?: boolean };
  PreRoom: { initialMode?: 'video' | 'voice'; initialThemeColor?: string } | undefined;
  PayoutAccount: undefined;
  CrashGame: undefined;
  Conversation: { userId: string; displayName: string | null };
  Call: { callId: string; otherUserId: string; otherUserDisplayName: string | null; isIncoming: boolean };
  LiveFormatPicker: undefined;
  GoLive: { initialTitle?: string; initialThemeColor?: string } | undefined;
  BlockedUsers: undefined;
  // videoId opens the feed on that video first (e.g. from "My Videos").
  VideoFeed: { videoId?: string } | undefined;
  VideoCreatorCenter: undefined;
  VideoSearch: undefined;
  VideoCamera: undefined;
  VideoEditor: { uri: string; durationMs: number; width?: number; height?: number };
  VideoPublish: {
    uri: string;
    durationMs: number;
    trimStartMs: number;
    trimEndMs: number;
    speed: 0.5 | 1 | 1.5 | 2;
    filter: string;
    effect: string;
    overlayUri: string | null;
    music: { uri: string; name: string; mimeType: string; volumeOriginal: number; volumeMusic: number } | null;
  };
  PkHistory: undefined;
};