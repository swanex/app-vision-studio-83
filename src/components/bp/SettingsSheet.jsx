import React, { useRef, useMemo } from 'react';
import { X, Upload, Download, Moon, Sun, LogOut, User } from 'lucide-react';

export const SettingsSheet = ({
  isOpen,
  onClose,
  currentUser,
  resolvedAvatar,
  records,
  theme,
  onSelectTheme,
  onExportCSV,
  onImportRawText,
  onLogout,
  onOpenAuth,
  appVersionString,
  keyboardHeight,
  dragOffset,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}) => {
  const fileInputRef = useRef(null);
  const dataSheetRef = useRef(null);

  const stats = useMemo(() => {
    if (!records || !Array.isArray(records)) return { days: 0, morning: 0, evening: 0 };
    const uniqueDays = new Set(records.map((r) => r.date)).size;
    let morning = 0;
    let evening = 0;
    records.forEach((r) => {
      const hour = parseInt((r.time || '09:00').split(':')[0], 10);
      if (hour < 13) morning++;
      else evening++;
    });
    return { days: uniqueDays, morning, evening };
  }, [records]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const ok = await onImportRawText(text);
      if (ok) onClose();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none bp-backdrop-enter"
      style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
      onClick={onClose}
    >
      <div
        ref={dataSheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
          maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '90vh'
        }}
        className={`w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] p-6 pb-8 flex flex-col ${
          dragOffset === 0 ? 'bp-sheet-enter' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto shrink-0 mb-4" />

        <div className="flex items-start justify-between mb-2">
          <h3 className="text-[36px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
            Настройки
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center pt-2 pb-6">
          <div className="w-[56px] h-[56px] rounded-full border-[1.5px] border-[var(--text-primary)] flex items-center justify-center text-[var(--text-primary)] mb-2.5 overflow-hidden bg-[var(--surface-input)]">
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={currentUser?.display_name || 'Профиль'}
                draggable={false}
                className="w-full h-full object-cover pointer-events-none"
              />
            ) : (
              <User className="w-7 h-7" strokeWidth={1.5} />
            )}
          </div>
          <div className="text-[13px] font-semibold text-[var(--text-muted)] mb-0.5">
            {currentUser ? 'Профиль' : 'Демо режим'}
          </div>
          <div className="text-[18px] font-bold text-[var(--text-primary)] leading-none">
            {currentUser ? `@${currentUser.username}` : 'Без облака'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-[var(--surface-secondary)] rounded-[22px] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="text-[12px] font-semibold text-[var(--text-muted)] leading-tight mb-2">Всего<br/>дней</span>
            <span className="text-[24px] font-bold text-[var(--text-primary)] leading-none">{stats.days}</span>
          </div>
          <div className="bg-[var(--surface-secondary)] rounded-[22px] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="text-[12px] font-semibold text-[var(--text-muted)] leading-tight mb-2">Утро</span>
            <span className="text-[24px] font-bold text-[var(--text-primary)] leading-none">{stats.morning}</span>
          </div>
          <div className="bg-[var(--surface-secondary)] rounded-[22px] p-3.5 flex flex-col justify-between min-h-[90px]">
            <span className="text-[12px] font-semibold text-[var(--text-muted)] leading-tight mb-2">Вечер</span>
            <span className="text-[24px] font-bold text-[var(--text-primary)] leading-none">{stats.evening}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="file"
            accept=".txt,.csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-[var(--surface-card)] rounded-[24px] py-4 px-3 font-bold text-[15px] text-[var(--text-primary)] flex flex-col items-center justify-center gap-2.5 active:scale-95 transition"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          >
            <Upload className="w-6 h-6" strokeWidth={2} />
            <span>Импорт данных</span>
          </button>
          
          <button
            type="button"
            onClick={onExportCSV}
            className="bg-[var(--surface-card)] rounded-[24px] py-4 px-3 font-bold text-[15px] text-[var(--text-primary)] flex flex-col items-center justify-center gap-2.5 active:scale-95 transition"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          >
            <Download className="w-6 h-6" strokeWidth={2} />
            <span>Скачать CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => onSelectTheme('dark')}
            className={`rounded-[24px] py-4 px-2 font-bold text-[15px] flex flex-col items-center justify-center gap-2.5 transition active:scale-95 ${
              theme === 'dark'
                ? 'bg-[var(--text-muted)] text-white'
                : 'bg-[var(--surface-card)] text-[var(--text-primary)]'
            }`}
            style={{ boxShadow: theme !== 'dark' ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}
          >
            <Moon className="w-6 h-6" strokeWidth={2} />
            <span>Тёмная тема</span>
          </button>
          
          <button
            type="button"
            onClick={() => onSelectTheme('light')}
            className={`rounded-[24px] py-4 px-2 font-bold text-[15px] flex flex-col items-center justify-center gap-2.5 transition active:scale-95 ${
              theme === 'light'
                ? 'bg-[var(--text-muted)] text-white'
                : 'bg-[var(--surface-card)] text-[var(--text-primary)]'
            }`}
            style={{ boxShadow: theme !== 'light' ? '0 2px 8px rgba(0,0,0,0.02)' : 'none' }}
          >
            <Sun className="w-6 h-6" strokeWidth={2} />
            <span>Светлая тема</span>
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-3">
          <div className="text-center text-[13px] font-semibold text-[var(--text-muted)] select-none">
            Версия {appVersionString}
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-4 rounded-[26px] bg-[var(--cta-logout-bg)] text-[var(--cta-logout-text)] text-[16px] font-bold flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] transition"
            >
              <LogOut className="w-5 h-5" strokeWidth={2.2} />
              Выйти из профиля
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-4 rounded-[26px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[16px] font-bold flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] transition"
            >
              <User className="w-5 h-5" strokeWidth={2.2} />
              Войти или создать профиль
            </button>
          )}
        </div>
      </div>
    </div>
  );
};