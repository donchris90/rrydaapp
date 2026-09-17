import React, { useState } from 'react';
import { X, Diamond, ArrowUpRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { formatCoins } from '../../utils/formatters';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { wallet, withdrawEarnings, user } = useProfile();
  const [amountDiamonds, setAmountDiamonds] = useState(100000);
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [bankName, setBankName] = useState('Access Bank / Paystack Payout');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.isKycVerified) {
      setStatusMsg({
        type: 'error',
        text: 'Real-name identity authentication required before creator cashouts.',
      });
      return;
    }

    if (amountDiamonds < 50000) {
      setStatusMsg({
        type: 'error',
        text: 'Minimum cashout threshold is 50,000 Diamonds ($50.00 USD).',
      });
      return;
    }

    const success = withdrawEarnings(amountDiamonds);
    if (success) {
      setStatusMsg({
        type: 'success',
        text: `Cashout request of $${(amountDiamonds / 1000).toFixed(2)} USD submitted successfully!`,
      });
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 1500);
    } else {
      setStatusMsg({
        type: 'error',
        text: 'Insufficient creator earnings balance for this amount.',
      });
    }
  };

  const estimatedUsd = (amountDiamonds / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-600 text-white">
              <Diamond className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Creator Cashout</h2>
              <span className="text-xs text-slate-500">
                Available: {formatCoins(wallet.creatorEarnings)} Diamonds
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleWithdraw} className="p-5 overflow-y-auto space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Amount presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Cashout Amount
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[50000, 100000, 250000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountDiamonds(amt)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                    amountDiamonds === amt
                      ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>{formatCoins(amt)}</div>
                  <div className="text-[10px] text-slate-400 font-normal">≈ ${(amt / 1000).toFixed(0)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Received */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Estimated Payout</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              ${estimatedUsd} USD
            </span>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bank / Payout Account
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 mb-2"
            />
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Account / IBAN Number"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black text-sm hover:brightness-105 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            Confirm Cashout <ArrowUpRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
