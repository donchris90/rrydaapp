export interface LiveStreamData {
  id: string;
  title: string;
  hostName: string;
  hostAvatar: string;
  hostLevel: number;
  diamonds: number;
  viewers: number;
  category: string;
  isFollowing: boolean;
  videoUrl?: string;
  streamerImage: string;
  opponent?: {
    name: string;
    avatar: string;
    level: number;
    streamerImage: string;
  };
}

export interface PkBattleState {
  isActive: boolean;
  timeLeft: number; // seconds
  myScore: number;
  theirScore: number;
  status: 'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'SETTLED';
  winner?: 'host' | 'opponent' | 'draw';
}

export interface ChatMessageItem {
  id: string;
  sender: string;
  level: number;
  text: string;
  isMe?: boolean;
  isVip?: boolean;
  giftTag?: string;
}

export interface GiftItem {
  id: string;
  name: string;
  coins: number;
  icon: string;
  category: 'Popular' | 'Luxury' | 'PK Buff' | 'Effects';
  color: string;
}

export interface FloatingHeart {
  id: number;
  x: number;
  color: string;
}
