export type OnlineStatus = 'online' | 'offline' | 'dnd';

export interface UserProfile {
  id: string;
  shortId: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl: string;
  bio: string;
  gender: 'female' | 'male' | 'other';
  age: number;
  countryCode: string; // ISO 2-letter e.g. "NG", "PH", "US", "ID"
  countryName: string;
  isKycVerified: boolean;
  kycStatus: 'unverified' | 'pending' | 'verified';
  vipLevel: number; // 0 = standard, 1-7 = VIP tiers
  wealthLevel: number; // 1-100 (based on coins spent)
  charmLevel: number; // 1-100 (based on gifts received / streaming)
  agency?: {
    id: string;
    name: string;
    code: string;
    commissionRate: number; // percentage
  };
  checkInStreak: number;
  lastCheckInDate?: string;
  referralCode: string;
  language?: string; // e.g. 'en', 'es', 'fr', 'pt', 'ar', 'zh', 'yo', 'ha', 'ig'
  onlineStatus?: 'online' | 'offline' | 'dnd';
}

export interface UserWallet {
  coins: number; // standard spendable coins
  creatorEarnings: number; // points / diamonds withdrawable to fiat
  bonusCoins: number;
  currencyCode: string;
  fiatValueEstimate: number; // approximate USD value
}

export interface SocialStats {
  pkWins: number;
  pkLosses: number;
  followingCount: number;
  followersCount: number;
  visitorsToday: number;
  totalVisitors: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'avatar_frame' | 'ride_mount' | 'chat_bubble' | 'entry_effect';
  icon: string;
  equipped: boolean;
  expiresInDays?: number;
}

export interface DailyRewardDay {
  day: number;
  coins: number;
  points?: number;
  specialItem?: string;
  isClaimed: boolean;
  isCurrent: boolean;
}

export interface FollowerUser {
  id: string;
  displayName: string;
  shortId: string;
  avatarUrl: string;
  bio?: string;
  countryCode: string;
  vipLevel: number;
  wealthLevel: number;
  charmLevel: number;
  isFollowing: boolean; // whether the current profile follows them back
  isLive?: boolean;
  onlineStatus?: 'online' | 'offline';
  followedTime: string;
  isSuperFan?: boolean;
  fansCount?: number;
}
