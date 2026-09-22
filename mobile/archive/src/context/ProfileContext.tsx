import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserWallet, SocialStats, InventoryItem, DailyRewardDay } from '../types/profile';
import { SupportedLanguage, TranslationDictionary, TRANSLATIONS, SUPPORTED_LANGUAGES, LanguageOption } from '../types/translations';

interface ProfileContextType {
  user: UserProfile;
  wallet: UserWallet;
  stats: SocialStats;
  inventory: InventoryItem[];
  dailyRewards: DailyRewardDay[];
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
  supportedLanguages: LanguageOption[];
  updateUser: (updates: Partial<UserProfile>) => void;
  updateStats: (updates: Partial<SocialStats>) => void;
  addCoins: (amount: number) => void;
  withdrawEarnings: (amount: number) => boolean;
  claimDailyReward: (day: number) => void;
  equipItem: (itemId: string) => void;
  resetToDefault: () => void;
}

const STORAGE_KEY_USER = 'rryda_profile_user';
const STORAGE_KEY_WALLET = 'rryda_profile_wallet';
const STORAGE_KEY_STATS = 'rryda_profile_stats';
const STORAGE_KEY_LANG = 'rryda_profile_language';
const STORAGE_KEY_DAILY_REWARDS = 'rryda_daily_rewards';

const DEFAULT_USER: UserProfile = {
  id: 'usr_98a72f10-b9e4-49c1',
  shortId: 'RY98241',
  displayName: 'Elena Star ✨',
  email: 'elena.live@rryda.com',
  phone: '+1 (555) 349-8812',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Top Host 🌟 | Music, Lifestyle & Daily PK Battles | Let’s hit 100K gems! 💖',
  gender: 'female',
  age: 23,
  countryCode: 'NG',
  countryName: 'Nigeria',
  isKycVerified: true,
  kycStatus: 'verified',
  vipLevel: 3,
  wealthLevel: 28,
  charmLevel: 42,
  language: 'en',
  onlineStatus: 'online',
  agency: {
    id: 'ag_alpha_01',
    name: 'Crown Talent Agency',
    code: 'CTA-8890',
    commissionRate: 15,
  },
  checkInStreak: 4,
  referralCode: 'RYDA-VIP88',
};

const DEFAULT_WALLET: UserWallet = {
  coins: 84520,
  creatorEarnings: 342500, // diamonds / points
  bonusCoins: 1250,
  currencyCode: 'USD',
  fiatValueEstimate: 342.50, // estimated cashout value
};

const DEFAULT_STATS: SocialStats = {
  pkWins: 148,
  pkLosses: 32,
  followingCount: 284,
  followersCount: 18920,
  visitorsToday: 642,
  totalVisitors: 89400,
};

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_1',
    name: 'Cyberpunk Neon Halo',
    category: 'avatar_frame',
    icon: 'Sparkles',
    equipped: true,
  },
  {
    id: 'inv_2',
    name: 'Phantom Golden Pegasus',
    category: 'ride_mount',
    icon: 'Crown',
    equipped: true,
    expiresInDays: 14,
  },
  {
    id: 'inv_3',
    name: 'Romantic Sakura Whisper',
    category: 'chat_bubble',
    icon: 'MessageSquare',
    equipped: false,
  },
];

const INITIAL_DAILY_REWARDS: DailyRewardDay[] = [
  { day: 1, coins: 50, isClaimed: true, isCurrent: false },
  { day: 2, coins: 100, isClaimed: true, isCurrent: false },
  { day: 3, coins: 150, isClaimed: true, isCurrent: false },
  { day: 4, coins: 300, points: 50, isClaimed: true, isCurrent: false },
  { day: 5, coins: 500, points: 100, isClaimed: false, isCurrent: true },
  { day: 6, coins: 800, isClaimed: false, isCurrent: false },
  { day: 7, coins: 2000, points: 500, specialItem: 'Gold Frame (3d)', isClaimed: false, isCurrent: false },
];

const ProfileContext = createContext<ProfileContextType | null>(null);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [wallet, setWallet] = useState<UserWallet>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WALLET);
      return saved ? JSON.parse(saved) : DEFAULT_WALLET;
    } catch {
      return DEFAULT_WALLET;
    }
  });

  const [stats, setStats] = useState<SocialStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? JSON.parse(saved) : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
  const [dailyRewards, setDailyRewards] = useState<DailyRewardDay[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAILY_REWARDS);
      return saved ? JSON.parse(saved) : INITIAL_DAILY_REWARDS;
    } catch {
      return INITIAL_DAILY_REWARDS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAILY_REWARDS, JSON.stringify(dailyRewards));
    } catch {
      // Ignore storage errors
    }
  }, [dailyRewards]);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('rryda_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rryda_theme', themeMode);
      if (themeMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Ignore storage errors
    }
  }, [themeMode]);
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved && saved in TRANSLATIONS) {
        return saved as SupportedLanguage;
      }
      return (user.language as SupportedLanguage) || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    setUser((prev) => ({ ...prev, language: lang }));
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WALLET, JSON.stringify(wallet));
    } catch {
      // Ignore storage errors
    }
  }, [wallet]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore storage errors
    }
  }, [stats]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const updateStats = (updates: Partial<SocialStats>) => {
    setStats((prev) => ({ ...prev, ...updates }));
  };

  const addCoins = (amount: number) => {
    setWallet((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }));
  };

  const withdrawEarnings = (amount: number): boolean => {
    if (wallet.creatorEarnings < amount) return false;
    setWallet((prev) => {
      const updatedEarnings = prev.creatorEarnings - amount;
      return {
        ...prev,
        creatorEarnings: updatedEarnings,
        fiatValueEstimate: Number((updatedEarnings / 1000).toFixed(2)),
      };
    });
    return true;
  };

  const claimDailyReward = (dayNumber: number) => {
    setDailyRewards((prev) =>
      prev.map((item) => {
        if (item.day === dayNumber && !item.isClaimed) {
          addCoins(item.coins);
          if (item.points) {
            setWallet((w) => ({
              ...w,
              creatorEarnings: w.creatorEarnings + item.points!,
              fiatValueEstimate: Number(((w.creatorEarnings + item.points!) / 1000).toFixed(2)),
            }));
          }
          setUser((u) => ({
            ...u,
            checkInStreak: u.checkInStreak + 1,
            lastCheckInDate: new Date().toISOString(),
          }));
          return { ...item, isClaimed: true, isCurrent: false };
        }
        return item;
      })
    );
  };

  const equipItem = (itemId: string) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, equipped: !item.equipped } : item))
    );
  };

  const resetToDefault = () => {
    setUser(DEFAULT_USER);
    setWallet(DEFAULT_WALLET);
    setStats(DEFAULT_STATS);
    setDailyRewards(INITIAL_DAILY_REWARDS);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_WALLET);
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_DAILY_REWARDS);
  };

  return (
    <ProfileContext.Provider
      value={{
        user,
        wallet,
        stats,
        inventory,
        dailyRewards,
        themeMode,
        setThemeMode,
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        updateUser,
        updateStats,
        addCoins,
        withdrawEarnings,
        claimDailyReward,
        equipItem,
        resetToDefault,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
