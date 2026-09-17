import React, { useState } from 'react';
import { X, Check, Copy, Shield, Building2, Radio, Gift, HelpCircle, Ban, History } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface GenericInfoModalProps {
  type: 'agency' | 'creator' | 'invite' | 'kyc' | 'help' | 'rules' | 'blocked' | 'history' | null;
  onClose: () => void;
}

export const GenericInfoModal: React.FC<GenericInfoModalProps> = ({ type, onClose }) => {
  const { user, updateUser, stats } = useProfile();
  const [copiedReferral, setCopiedReferral] = useState(false);

  if (!type) return null;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 1800);
  };

  const handleToggleKyc = () => {
    updateUser({ isKycVerified: !user.isKycVerified, kycStatus: user.isKycVerified ? 'unverified' : 'verified' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
            {type === 'kyc'
              ? 'Real-Name Identity Authentication'
              : type === 'agency'
              ? 'Agency Management'
              : type === 'creator'
              ? 'Streamer & Creator Center'
              : type === 'invite'
              ? 'Invite Friends & Rebate'
              : type === 'rules'
              ? 'Community Standards & Conduct'
              : type === 'blocked'
              ? 'Blocked User List'
              : type === 'history'
              ? 'Live Watch History'
              : 'Help Center & Support'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Body based on type */}
        <div className="p-5 overflow-y-auto space-y-4">
          {type === 'agency' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold mb-1">
                  <Building2 className="w-4 h-4" /> Joined Agency
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {user.agency?.name ?? 'Crown Talent Agency'}
                </div>
                <div className="text-slate-500 mt-1">
                  Agency Code: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.agency?.code}</span>
                </div>
                <div className="text-slate-500">
                  Host Commission Settlement: <strong className="text-blue-600">{user.agency?.commissionRate}%</strong>
                </div>
              </div>
              <p className="text-slate-500">
                Agencies provide training, target broadcast bonuses, and prioritized room placement.
              </p>
            </div>
          )}

          {type === 'creator' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/40">
                  <span className="text-slate-500">Valid Days This Month</span>
                  <div className="text-xl font-black text-purple-600 mt-1">18 / 22 Days</div>
                </div>
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/40">
                  <span className="text-slate-500">Broadcast Duration</span>
                  <div className="text-xl font-black text-pink-600 mt-1">46.5 Hours</div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Daily Target Progress</span>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Target: 2 hours active stream</span>
                  <span className="text-emerald-600 font-bold">120m / 120m (Completed)</span>
                </div>
              </div>
            </div>
          )}

          {type === 'invite' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Invite friends to RrydaApp. When they register with your referral code and top up, you receive an instant 10% coin rebate!
              </p>
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-700 font-bold uppercase">Your Unique Referral Code</span>
                  <div className="text-lg font-black font-mono tracking-wider text-slate-900 dark:text-white">
                    {user.referralCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 hover:brightness-105 active:scale-95 transition-all"
                >
                  {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReferral ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {type === 'kyc' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Real-name verification is required for going live, audio room mic broadcasting, and creator cashouts.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Status</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {user.isKycVerified ? 'Identity Verified (Green Pass)' : 'Unverified'}
                  </div>
                </div>
                <button
                  onClick={handleToggleKyc}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    user.isKycVerified
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {user.isKycVerified ? 'Revoke (Test)' : 'Approve ID'}
                </button>
              </div>
            </div>
          )}

          {type === 'rules' && (
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>Respectful Interaction:</strong> Harassment, hate speech, or abuse will lead to permanent room ban.</p>
              <p>• <strong>Strict Adult Standards:</strong> No nudity, sexual exploitation, or suggestive live broadcasting.</p>
              <p>• <strong>Financial Safety:</strong> Any attempts to transact offline outside the app ledger are strictly prohibited.</p>
              <p>• <strong>Provably Fair Games:</strong> All round outcomes are cryptographically signed and immutable.</p>
            </div>
          )}

          {type === 'blocked' && (
            <div className="text-xs text-center py-6 text-slate-500">
              <Ban className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-medium">No users currently blocked.</p>
              <p className="text-[11px] text-slate-400 mt-1">Blocked users cannot send you direct messages or join your private rooms.</p>
            </div>
          )}

          {type === 'history' && (
            <div className="space-y-2 text-xs">
              {[
                { host: 'DJ Luna Live 🎧', time: 'Today, 2:15 PM', coinsGifted: 500 },
                { host: 'Sarah Piano Room 🎹', time: 'Yesterday, 9:30 PM', coinsGifted: 2400 },
                { host: 'Speed PK Battle ⚔️', time: 'Sep 15, 6:00 PM', coinsGifted: 12000 },
              ].map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{h.host}</div>
                    <div className="text-[10px] text-slate-400">{h.time}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-500 font-bold">-{h.coinsGifted}</span>
                    <span className="text-[10px] text-slate-400 ml-1">Coins</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'help' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Have questions about coins, cashout delays, or host verification? Our 24/7 dedicated support team is available.
              </p>
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/40 text-teal-800 dark:text-teal-300">
                Live Support Agent Available: Average response time &lt; 2 minutes.
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors"
              >
                Start Live Chat Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
