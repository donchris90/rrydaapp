import React, { useState } from 'react';
import {
  Flag,
  X,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Camera,
  FileCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export interface ReportReason {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export const LIVE_STREAM_REPORT_REASONS: ReportReason[] = [
  {
    id: 'harassment',
    category: 'Conduct & Safety',
    title: 'Harassment or Cyberbullying',
    description: 'Targeted attacks, threats, insults, or hateful slurs during live stream or chat.',
    severity: 'high',
  },
  {
    id: 'nudity_explicit',
    category: 'Content Violation',
    title: 'Nudity or Sexual Content',
    description: 'Explicit body exposure, sexually suggestive acts, or non-consensual imagery.',
    severity: 'high',
  },
  {
    id: 'fraud_scam',
    category: 'Financial Integrity',
    title: 'Fraud, Scams or Fake Gifts',
    description: 'Soliciting unauthorized off-platform payments, fake giveaways, or coin phishing.',
    severity: 'high',
  },
  {
    id: 'violence_threats',
    category: 'Safety & Danger',
    title: 'Violence, Weapons, or Self-Harm',
    description: 'Brandishing weapons, promoting physical harm, or dangerous self-injury.',
    severity: 'high',
  },
  {
    id: 'hate_speech',
    category: 'Community Standard',
    title: 'Hate Speech & Discrimination',
    description: 'Attacking race, ethnicity, religion, disability, sexual orientation, or gender.',
    severity: 'high',
  },
  {
    id: 'underage',
    category: 'Minor Protection',
    title: 'Underage User or Child Safety Concern',
    description: 'Broadcaster or participant appears to be under the minimum live-streaming age.',
    severity: 'high',
  },
  {
    id: 'spam_impersonation',
    category: 'Identity & Fraud',
    title: 'Impersonation or Commercial Spam',
    description: 'Pretending to be another verified creator, agency, celebrity, or bot spamming.',
    severity: 'medium',
  },
  {
    id: 'copyright_piracy',
    category: 'Intellectual Property',
    title: 'Unauthorized Re-broadcast / Copyright',
    description: 'Streaming copyrighted movies, TV sports, or other creators without consent.',
    severity: 'low',
  },
];

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    name: string;
    id: string;
    avatar?: string;
  };
  onSubmitSuccess?: (ticketId: string, reasonTitle: string) => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  targetUser = {
    name: 'Broadcaster',
    id: '8829104',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  onSubmitSuccess,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [includeScreenshot, setIncludeScreenshot] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    reason: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedReasonId('');
    setDetails('');
    setSubmittedTicket(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReasonId) return;

    setIsSubmitting(true);
    const selectedReason = LIVE_STREAM_REPORT_REASONS.find((r) => r.id === selectedReasonId);
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedTicket({
        id: ticketId,
        reason: selectedReason?.title || 'Community Guideline Violation',
      });
      onSubmitSuccess?.(ticketId, selectedReason?.title || 'Community Guideline Violation');
    }, 600);
  };

  return (
    <div
      id="report-user-modal-overlay"
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div
        id="report-user-modal-card"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <Flag className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight">Report User</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Live-Streaming Trust & Safety Protection
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-report-modal-btn"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close report dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {submittedTicket ? (
            /* Success confirmation screen */
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Report Submitted Successfully
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                Thank you for helping keep our live-streaming community safe. Our 24/7 Trust &
                Safety moderation team will review this report within 15 minutes.
              </p>

              <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 text-left border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Ticket ID:</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {submittedTicket.id}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Violation:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {submittedTicket.reason}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    Under Priority Review
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="report-done-btn"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md transition-all cursor-pointer mt-2"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Target User Info Header */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {targetUser.avatar ? (
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300 font-bold flex items-center justify-center text-sm">
                      {targetUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {targetUser.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      User ID: {targetUser.id}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                  Report Target
                </span>
              </div>

              {/* Predefined Live-streaming Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Violation Category <span className="text-rose-500">*</span>
                </label>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {LIVE_STREAM_REPORT_REASONS.map((reason) => {
                    const isSelected = selectedReasonId === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedReasonId(reason.id)}
                        className={`w-full text-left p-2.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 dark:border-purple-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {reason.title}
                            </span>
                            {reason.severity === 'high' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                High Severity
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {reason.description}
                          </p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Details Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Context / Timestamp (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe what occurred, PK match time, or specific message quotes..."
                  rows={2}
                  maxLength={300}
                  className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Do not include sensitive personal passwords.</span>
                  <span>{details.length}/300</span>
                </div>
              </div>

              {/* Screenshot / Evidence Toggle */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Auto-Attach Live Room Stream Frame
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Includes broadcaster state snapshot for rapid verification
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeScreenshot}
                    onChange={(e) => setIncludeScreenshot(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                </label>
              </div>

              {/* Trust & Safety Advisory */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed border border-amber-200/60 dark:border-amber-800/40">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  False reporting or malicious abuse of the reporting tool may lead to penalties or
                  restrictions on your account.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="cancel-report-btn"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-report-btn"
                  disabled={!selectedReasonId || isSubmitting}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
