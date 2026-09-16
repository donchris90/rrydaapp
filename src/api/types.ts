// Kept intentionally minimal — only the fields the app actually reads,
// not a full mirror of every backend field. Add fields here as new screens
// need them, rather than speculatively matching the whole Prisma schema.

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  roles: string[];
  userId: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  countryCode: string;
  status: string;
  roles: { role: string }[];
  // Set only by an admin via PATCH /users/:id/kyc (see users.service.ts) —
  // never something the app itself sets. Read-only status display.
  kycVerified: boolean;
  referralCode: string;
  avatarUrl: string | null;
}

export interface Referral {
  id: string;
  displayName: string | null;
  createdAt: string;
}

// Mutual-follow-derived counts — see social.service.ts's stats().
export interface SocialStats {
  following: number;
  followers: number;
  friends: number;
}

// Null means "not in an agency," distinct from the query still loading.
export interface AgencyMembership {
  id: string;
  agencyId: string;
  agencyName: string;
  commissionBps: number;
  status: string;
  joinedAt: string;
}

export interface WalletBalances {
  coin: string; // BigInt serialized as string by the backend — see wallet.service.ts
  creatorEarnings: string;
}

export interface FeedUser {
  id: string;
  displayName: string | null;
  countryCode: string;
  // Real signal from feed.service.ts's attachLiveStatus — whether this
  // person currently has a LiveSession with status LIVE. Not a viewer
  // count/thumbnail (those aren't in the API), just the honest on/off fact.
  isLive: boolean;
}

// GET /feed/live-now — real LiveSession rows (status LIVE), host name
// joined in server-side. No viewer count/thumbnail here either, for the
// same reason FeedUser doesn't have one: nothing tracks either yet.
export interface LiveNowSession {
  id: string;
  hostId: string;
  hostDisplayName: string | null;
  title: string;
  category: string | null;
  coverUrl: string | null;
  countryCode: string;
  startedAt: string;
}

// GET /gifts/ranking — real gift totals grouped by recipient over a
// lookback window (see GiftService.ranking). honorScore is a coin sum,
// not a fabricated "honor level."
export interface HonorRankingEntry {
  userId: string;
  displayName: string | null;
  countryCode: string;
  honorScore: number;
}
