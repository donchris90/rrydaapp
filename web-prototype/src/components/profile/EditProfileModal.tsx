import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Camera, Globe, ChevronDown, Loader2, Crop, Upload, Sparkles } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { SupportedLanguage } from '../../types/translations';
import { ImageCropModal } from './ImageCropModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (message: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { user, updateUser, language, setLanguage, t, supportedLanguages } = useProfile();

  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [gender, setGender] = useState(user.gender);
  const [age, setAge] = useState(user.age);
  const [countryCode, setCountryCode] = useState(user.countryCode);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Crop modal overlay states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCropForUrl = (url: string) => {
    setImageToCrop(url);
    setIsCropModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageToCrop(reader.result);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);

    // reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setAvatarUrl(croppedDataUrl);
    onShowToast?.('Profile picture cropped & preview updated!');
  };

  // Sync state if modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setBio(user.bio);
      setGender(user.gender);
      setAge(user.age);
      setCountryCode(user.countryCode);
      setAvatarUrl(user.avatarUrl);
      setSelectedLanguage(language);
      setIsSaving(false);
      setIsSaved(false);
    }
  }, [isOpen, user, language]);

  if (!isOpen) return null;

  const currentLangOption = supportedLanguages.find((l) => l.code === selectedLanguage) || supportedLanguages[0];

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    // Instant live preview of language switch
    setLanguage(newLang);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);

    setTimeout(() => {
      updateUser({
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim(),
        gender,
        age: Number(age) || 20,
        countryCode: countryCode.toUpperCase(),
        avatarUrl,
        language: selectedLanguage,
      });
      setLanguage(selectedLanguage);
      setIsSaving(false);
      setIsSaved(true);
      onShowToast?.(t.savedSuccessfully || 'Profile and language settings saved!');

      setTimeout(() => {
        onClose();
      }, 700);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.settingsAndProfile}
            </h2>
          </div>
          <button
            id="close-edit-profile-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* App Language Selection with Flag Accessibility */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/40">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="language-dropdown-select"
                className="flex items-center gap-1.5 text-xs font-bold text-purple-950 dark:text-purple-200"
              >
                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{t.appLanguage}</span>
                {/* Flag Badge indicator next to label */}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-purple-200 dark:border-purple-700 shadow-xs text-xs font-semibold select-none"
                  title={`${currentLangOption.name} (${currentLangOption.nativeName})`}
                  aria-label={`${currentLangOption.name} selected`}
                >
                  <span className="text-sm">{currentLangOption.flag}</span>
                  <span className="text-[11px] font-bold">{currentLangOption.code.toUpperCase()}</span>
                </span>
              </label>

              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                {currentLangOption.name}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              {t.languageSelectHint}
            </p>

            <div className="relative flex items-center">
              {/* Country flag icon next to the selection inside the select wrapper */}
              <div
                id="language-select-flag-icon"
                className="absolute left-3 z-10 flex items-center justify-center pointer-events-none select-none text-lg"
                aria-hidden="true"
              >
                <span>{currentLangOption.flag}</span>
              </div>

              <select
                id="language-dropdown-select"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                className="w-full appearance-none pl-10 pr-10 py-2.5 text-sm font-semibold rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all cursor-pointer shadow-xs"
                aria-label={t.appLanguage}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 dark:text-white py-1">
                    {lang.flag} {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-purple-600 dark:text-purple-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Quick Flag Selection Chips for Faster Navigation */}
            <div className="mt-2.5 pt-2 border-t border-purple-200/50 dark:border-purple-800/30">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider">
                <span>Quick Flag Select</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">{supportedLanguages.length} Languages</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    title={`${lang.name} (${lang.nativeName})`}
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                      selectedLanguage === lang.code
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="text-[11px]">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar selector & Crop Studio */}
          <div className="flex flex-col items-center pt-1">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-22 h-22 rounded-full object-cover border-2 border-purple-500 shadow-md transition-transform group-hover:scale-102"
              />
              {/* Quick Crop / Edit overlay on avatar */}
              <button
                type="button"
                id="crop-avatar-overlay-btn"
                onClick={() => handleOpenCropForUrl(avatarUrl)}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                title="Crop & Reframe Avatar"
              >
                <Crop className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Crop Photo</span>
              </button>

              <button
                type="button"
                id="camera-crop-btn"
                onClick={() => handleOpenCropForUrl(avatarUrl)}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-colors cursor-pointer"
                title="Crop Avatar"
              >
                <Crop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Upload & Crop Buttons Row */}
            <div className="flex items-center gap-2 mt-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="avatar-file-upload-input"
              />

              <button
                type="button"
                id="upload-photo-crop-btn"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New</span>
              </button>

              <button
                type="button"
                id="refine-crop-btn"
                onClick={() => handleOpenCropForUrl(avatarUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Crop className="w-3.5 h-3.5 text-purple-500" />
                <span>Crop & Preview</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or pick a ready-to-use preset:</span>
            </span>

            <div className="flex items-center gap-2 mt-1.5">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAvatarUrl(url);
                    handleOpenCropForUrl(url);
                  }}
                  title="Click to select and crop"
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    avatarUrl === url ? 'border-purple-600 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.nickname}
            </label>
            <input
              type="text"
              id="edit-display-name-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              placeholder="e.g. Star Streamer"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.bioLabel}
            </label>
            <textarea
              id="edit-bio-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={120}
              placeholder={t.bioPlaceholder}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Gender & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.gender}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="gender-female-btn"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'female'
                      ? 'bg-pink-50 border-pink-500 text-pink-600 dark:bg-pink-950/40 dark:text-pink-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ♀ {t.female}
                </button>
                <button
                  type="button"
                  id="gender-male-btn"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    gender === 'male'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  ♂ {t.male}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t.age}
              </label>
              <input
                type="number"
                id="edit-age-input"
                min={18}
                max={99}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Country Code */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t.countryRegion} (ISO 2-Letter)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['NG', 'PH', 'US', 'ID', 'IN', 'BR', 'GB', 'KE'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCountryCode(code)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    countryCode === code
                      ? 'bg-purple-50 border-purple-500 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Actions - Save Changes with visual state feedback */}
          <div className="pt-2">
            <button
              id="save-profile-btn"
              type="submit"
              disabled={isSaving}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white scale-[1.01]'
                  : isSaving
                  ? 'bg-purple-400 text-white opacity-90 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:opacity-95 active:scale-[0.99]'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" /> Saved Successfully!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> {t.saveChanges}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Profile Picture Crop & Preview Overlay */}
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={imageToCrop}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
};
