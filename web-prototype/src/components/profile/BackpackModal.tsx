import React from 'react';
import { X, Package, Check, Sparkles } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';

interface BackpackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackpackModal: React.FC<BackpackModalProps> = ({ isOpen, onClose }) => {
  const { inventory, equipItem } = useProfile();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500 text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">My Backpack</h2>
              <span className="text-xs text-slate-500">Avatar frames, ride mounts, chat bubbles</span>
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
        <div className="p-5 overflow-y-auto space-y-3">
          {inventory.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                item.equipped
                  ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {item.category.replace('_', ' ')}
                  </span>
                  {item.expiresInDays && (
                    <span className="ml-2 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      • {item.expiresInDays}d left
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => equipItem(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  item.equipped
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                }`}
              >
                {item.equipped ? 'Equipped' : 'Equip'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
