import { GiftItem } from './types';

export const GIFTS_CATALOG: GiftItem[] = [
  { id: 'rose', name: 'Rose', coins: 1, icon: '🌹', category: 'Popular', color: '#FF2A6D' },
  { id: 'heart', name: 'Love Heart', coins: 10, icon: '💖', category: 'Popular', color: '#FF4081' },
  { id: 'donut', name: 'Glazed Donut', coins: 30, icon: '🍩', category: 'Popular', color: '#FFB800' },
  { id: 'boxing_glove', name: 'PK Punch', coins: 50, icon: '🥊', category: 'PK Buff', color: '#FF3B30' },
  { id: 'energy_drink', name: 'Energy Boost', coins: 100, icon: '⚡', category: 'PK Buff', color: '#00D2FF' },
  { id: 'super_shield', name: 'Iron Guard', coins: 300, icon: '🛡️', category: 'PK Buff', color: '#FF2E7E' },
  { id: 'sports_car', name: 'Cyber Roadster', coins: 1200, icon: '🏎️', category: 'Luxury', color: '#00E5FF' },
  { id: 'super_yacht', name: 'Ocean Yacht', coins: 3500, icon: '🛥️', category: 'Luxury', color: '#FFB800' },
  { id: 'castle', name: 'Royal Castle', coins: 8888, icon: '🏰', category: 'Luxury', color: '#E040FB' },
  { id: 'rocket', name: 'Space Rocket', coins: 12000, icon: '🚀', category: 'Effects', color: '#FF5722' },
  { id: 'phoenix', name: 'Golden Phoenix', coins: 25000, icon: '🦅', category: 'Effects', color: '#FFD700' },
  { id: 'dragon', name: 'Imperial Dragon', coins: 50000, icon: '🐉', category: 'Effects', color: '#FF1744' },
];

export const INITIAL_MESSAGES = [
  { id: '1', sender: 'Elena_V', level: 18, text: 'Welcome everyone! Tap the screen for likes! ✨' },
  { id: '2', sender: 'KingKev', level: 34, isVip: true, text: 'Let’s crush this PK round team!! 🥊🔥' },
  { id: '3', sender: 'Lucas99', level: 7, text: 'Hello from Brazil 🇧🇷' },
  { id: '4', sender: 'Maya_S', level: 22, text: 'Dropping hearts for the boost! 💕' },
];
