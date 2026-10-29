import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, ChevronDown, Upload, Download, Moon, Sun, LogOut, User } from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_KEY,
  LEGACY_AVATAR_KEY,
  USER_THEME_PREFIX,
  DEFAULT_TAGS_ROMA,
  DEFAULT_TAGS_NEW_USER,
  HOURS_OPTIONS,
  MINUTES_OPTIONS,
  handleInputEnterBlur,
  scrollTargetIntoSheetView
} from './bpUtils';
import { ScanFrameIcon, DrumPicker } from './BpIconsAndWidgets';
import { TonometerScannerModal } from './TonometerScannerModal';

// 1. ШТОРКА АВТОРИЗАЦИИ И РЕГИСТРАЦИИ
export const AuthSheet = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  keyboardHeight,
  dragOffset,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onAuthSuccess
}) => {
  const [authMode, setAuthMode] = useState('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const authSheetRef = useRef(null);
  const authCtaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAuthError('');
      setLoginPin('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (pinOverride) => {
    const cleanLogin = loginUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanPin = (pinOverride !== undefined ? pinOverride : loginPin).replace(/\D/g, '');

    if (!cleanLogin || cleanPin.length !== 4) {
      setAuthError('Введите логин и 4 цифры ПИН-кода');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/bp_users?username=eq.${encodeURIComponent(cleanLogin)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'x-user-login': cleanLogin,
            'x-user-pin': cleanPin
          }
        }
      );

      if (!res.ok) throw new Error('Ошибка сети');
      const rows = await res.json();

      if (!Array.isArray(rows) || rows.length === 0) {
        setAuthError('Неверный логин или ПИН-код');
        setAuthLoading(false);
        return;
      }

      const dbUser = rows[0];
      const legacyAvatar =
        cleanLogin === 'swanex' ? localStorage.getItem(LEGACY_AVATAR_KEY) : null;

      const savedUserTheme = localStorage.getItem(`${USER_THEME_PREFIX}${dbUser.username}`);
      const resolvedUserTheme =
        savedUserTheme === 'dark' || savedUserTheme === 'light' ? savedUserTheme : theme;

      localStorage.setItem(`${USER_THEME_PREFIX}${dbUser.username}`, resolvedUserTheme);
      setTheme(resolvedUserTheme);

      const loggedUser = {
        username: dbUser.username,
        pin: cleanPin,
        display_name: dbUser.display_name || cleanLogin,
        avatar: dbUser.avatar || legacyAvatar || null,
        theme: resolvedUserTheme,
        tags: Array.isArray(dbUser.tags)
          ? dbUser.tags.slice(0, 4)
          : cleanLogin === 'swanex'
          ? DEFAULT_TAGS_ROMA
          : DEFAULT_TAGS_NEW_USER
      };

      await onAuthSuccess(loggedUser, 'login', Boolean(!dbUser.avatar && legacyAvatar), legacyAvatar);
      setAuthLoading(false);
      onClose();
    } catch (e) {
      console.error(e);
      setAuthError('Не удалось войти. Проверьте подключение');
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    const cleanLogin = regUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanName = regDisplayName.trim();
    const cleanPin = regPin.replace(/\D/g, '');

    if (!cleanLogin || !cleanName || cleanPin.length !== 4) {
      setAuthError('Заполните логин (лат.), имя и 4 цифры ПИН-кода');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const payload = {
        username: cleanLogin,
        pin: cleanPin,
        display_name: cleanName,
        tags: DEFAULT_TAGS_NEW_USER
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/bp_users`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'x-user-login': cleanLogin,
          'x-user-pin': cleanPin
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 409) {
          setAuthError('Этот логин уже занят, выберите другой');
        } else {
          setAuthError('Ошибка при создании профиля');
        }
        setAuthLoading(false);
        return;
      }

      localStorage.setItem(`${USER_THEME_PREFIX}${cleanLogin}`, theme);

      const newUser = {
        ...payload,
        avatar: null,
        theme
      };

      await onAuthSuccess(newUser, 'register', false, null);
      setAuthLoading(false);
      onClose();
    } catch (e) {
      console.error(e);
      setAuthError('Ошибка сети при регистрации');
      setAuthLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none bp-backdrop-enter"
      style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
      onClick={onClose}
    >
      <form
        ref={authSheetRef}
        autoComplete="off"
        onSubmit={(e) => e.preventDefault()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
          maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '92vh'
        }}
        className={`w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-5 pb-6 flex flex-col items-center gap-4 ${
          dragOffset === 0 ? 'bp-sheet-enter' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full shrink-0" />

        {keyboardHeight === 0 && (
          <div className="self-stretch pt-1 flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 flex flex-col items-start gap-2.5">
              <h3 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                Профиль
              </h3>
              <p className="text-[15px] font-medium text-[var(--text-secondary)] leading-tight">
                {authMode === 'login'
                  ? 'Войдите, чтобы продолжить вести ваши измерения'
                  : 'Создайте аккаунт, чтобы начать сохранять ваши измерения'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] shrink-0 cursor-pointer mt-1"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        )}

        <div className="self-stretch p-1.5 bg-[var(--surface-secondary)] rounded-full grid grid-cols-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
            className={`py-3 rounded-full text-[16px] font-bold transition cursor-pointer ${
              authMode === 'login'
                ? 'bg-[var(--auth-tab-active-bg)] text-[var(--auth-tab-active-text)]'
                : 'text-[var(--auth-tab-inactive-text)] hover:opacity-80'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError('');
            }}
            className={`py-3 rounded-full text-[16px] font-bold transition cursor-pointer ${
              authMode === 'register'
                ? 'bg-[var(--auth-tab-active-bg)] text-[var(--auth-tab-active-text)]'
                : 'text-[var(--auth-tab-inactive-text)] hover:opacity-80'
            }`}
          >
            Создать
          </button>
        </div>

        {authMode === 'login' ? (
          <div className="self-stretch flex flex-col items-start gap-3.5">
            <div className="self-stretch flex flex-col items-start gap-2.5">
              <label className="self-stretch h-[60px] px-5 py-2.5 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                  Логин
                </span>
                <input
                  type="text"
                  name="nofill_bp_login_alias"
                  inputMode="text"
                  enterKeyHint="next"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="Латиницей"
                  value={loginUsername}
                  onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                  onChange={(e) => {
                    setLoginUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                    );
                    setAuthError('');
                  }}
                  className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                />
              </label>

              <label className="self-stretch h-[60px] px-5 py-2.5 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                  ПИН-код
                </span>
                <input
                  type="text"
                  name="nofill_bp_login_code"
                  inputMode="numeric"
                  enterKeyHint="done"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="••••"
                  value={loginPin}
                  onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                  onKeyDown={handleInputEnterBlur}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setLoginPin(clean);
                    setAuthError('');
                    if (clean.length === 4 && loginUsername.trim()) {
                      handleLoginSubmit(clean);
                    }
                  }}
                  className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                />
              </label>
            </div>

            {authError && (
              <p className="self-stretch text-center text-[14px] font-bold text-red-500 -mt-1">
                {authError}
              </p>
            )}

            <button
              ref={authCtaRef}
              type="button"
              disabled={authLoading}
              onClick={() => handleLoginSubmit()}
              className="self-stretch py-[17px] rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-0.5 shrink-0"
            >
              {authLoading ? 'Проверяем...' : 'Войти в дневник'}
            </button>
          </div>
        ) : (
          <div className="self-stretch flex flex-col items-start gap-3.5">
            <div className="self-stretch flex flex-col items-start gap-2.5">
              <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                  Ваше имя
                </span>
                <input
                  type="text"
                  name="nofill_bp_reg_label"
                  inputMode="text"
                  enterKeyHint="next"
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="Например Нина"
                  value={regDisplayName}
                  onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                  onChange={(e) => {
                    setRegDisplayName(e.target.value);
                    setAuthError('');
                  }}
                  className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                />
              </label>

              <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                  Логин
                </span>
                <input
                  type="text"
                  name="nofill_bp_reg_alias"
                  inputMode="text"
                  enterKeyHint="next"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="Латиницей"
                  value={regUsername}
                  onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                  onChange={(e) => {
                    setRegUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
                    );
                    setAuthError('');
                  }}
                  className="flex-1 min-w-0 w-full text-left text-[18px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                />
              </label>

              <label className="self-stretch h-[58px] px-5 py-2 bg-[var(--surface-input)] rounded-[22px] flex items-center gap-0.5 cursor-text">
                <span className="w-[85px] text-[16px] font-bold text-[var(--text-label-strong)] text-left select-none shrink-0">
                  ПИН-код
                </span>
                <input
                  type="text"
                  name="nofill_bp_reg_code"
                  inputMode="numeric"
                  enterKeyHint="done"
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="••••"
                  value={regPin}
                  onFocus={() => scrollTargetIntoSheetView(authCtaRef)}
                  onKeyDown={handleInputEnterBlur}
                  onChange={(e) => {
                    setRegPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setAuthError('');
                  }}
                  className="flex-1 min-w-0 w-full text-left text-[30px] leading-none tracking-[10px] font-extrabold text-[var(--text-primary)] placeholder-[var(--placeholder-input)] focus:outline-none bg-transparent select-text"
                />
              </label>
            </div>

            {authError && (
              <p className="self-stretch text-center text-[14px] font-bold text-red-500 -mt-1">
                {authError}
              </p>
            )}

            <button
              ref={authCtaRef}
              type="button"
              disabled={authLoading}
              onClick={handleRegisterSubmit}
              className="self-stretch py-[17px] rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center active:scale-[0.99] transition cursor-pointer mt-0.5 shrink-0"
            >
              {authLoading ? 'Создаем...' : 'Создать дневник'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};



// 2. ШТОРКА ВВОДА НОВОГО ЗАМЕРА
export const AddRecordSheet = ({
  isOpen,
  onClose,
  currentUser,
  userTags,
  records,
  onRemoveTag,
  onSaveRecord,
  keyboardHeight,
  dragOffset,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onOverlayStateChange
}) => {
  const [sysInput, setSysInput] = useState('');
  const [diaInput, setDiaInput] = useState('');
  const [pulseInput, setPulseInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeInput, setTimeInput] = useState('09:30');

  const [baseSeries, setBaseSeries] = useState(null);
  const [pendingScans, setPendingScans] = useState([]);
  
  // Стейты для визуального таймера окна (5 минут)
  const [seriesStartTime, setSeriesStartTime] = useState(null);
  const [timerProgress, setTimerProgress] = useState(0);

  const [inputsUnlocked, setInputsUnlocked] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanDemoNotice, setScanDemoNotice] = useState(false);
  const [flashHighlight, setFlashHighlight] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState('09:00');

  const sysRef = useRef(null);
  const diaRef = useRef(null);
  const pulseRef = useRef(null);
  const noteRef = useRef(null);
  const addSheetRef = useRef(null);
  const saveCtaRef = useRef(null);
  const demoNoticeTimerRef = useRef(null);
  const pulseBlurTimerRef = useRef(null);

  useEffect(() => {
    onOverlayStateChange?.({ scannerOpen, timePickerOpen });
  }, [scannerOpen, timePickerOpen, onOverlayStateChange]);

  useEffect(() => {
    if (!isOpen) {
      setInputsUnlocked(false);
      setScannerOpen(false);
      setScanDemoNotice(false);
      setTimePickerOpen(false);
      setBaseSeries(null);
      setPendingScans([]);
      setSeriesStartTime(null);
      setTimerProgress(0);
      if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
      return;
    }

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    setDateInput(todayIso);
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${hh}:${mm}`;
    setTimeInput(defaultTime);

    const t = setTimeout(() => {
      setInputsUnlocked(true);
      if (sysRef.current) sysRef.current.focus();
    }, 140);

    if (Array.isArray(records) && records.length > 0) {
      const todayRecords = records.filter((r) => r.date === todayIso);
      if (todayRecords.length > 0) {
        const sortedToday = [...todayRecords].sort((a, b) =>
          (b.time || '00:00').localeCompare(a.time || '00:00')
        );
        const latest = sortedToday[0];
        if (latest && latest.time) {
          const match = latest.id.match(/-s(\d+)$/);
          const latestSeriesCount = match ? parseInt(match[1], 10) : 1;
          const [lH, lM] = latest.time.split(':').map(Number);
          const [cH, cM] = defaultTime.split(':').map(Number);
          const diffMinutes = (cH * 60 + cM) - (lH * 60 + lM);

          if (diffMinutes >= 0 && diffMinutes <= 5) {
            setBaseSeries({
              targetId: latest.id,
              count: latestSeriesCount,
              sys: latest.sys,
              dia: latest.dia,
              pulse: latest.pulse,
              note: latest.note || ''
            });
            if (latest.note && !noteInput) {
              setNoteInput(latest.note);
            }
            // Вычисляем виртуальную точку старта, чтобы прогресс-бар уже был частично заполнен
            setSeriesStartTime(Date.now() - (diffMinutes * 60 * 1000));
          }
        }
      }
    }

    return () => clearTimeout(t);
  }, [isOpen, records]);

  // Эффект для плавной отрисовки таймера в блоке "Время замера"
  useEffect(() => {
    if (!isOpen || !currentUser || !seriesStartTime) {
      setTimerProgress(0);
      return;
    }
    
    const updateProgress = () => {
      const elapsed = Date.now() - seriesStartTime;
      const total = 5 * 60 * 1000; // 5 минут
      const p = Math.min(100, (elapsed / total) * 100);
      setTimerProgress(p);
    };
    
    updateProgress();
    const intervalId = setInterval(updateProgress, 1000);
    return () => clearInterval(intervalId);
  }, [isOpen, currentUser, seriesStartTime]);

  const handleScannerDetected = useCallback(({ sys, dia, pulse }) => {
    if (pulseBlurTimerRef.current) clearTimeout(pulseBlurTimerRef.current);
    sysRef.current?.blur();
    diaRef.current?.blur();
    pulseRef.current?.blur();
    noteRef.current?.blur();

    const sVal = parseInt(sys, 10);
    const dVal = parseInt(dia, 10);
    const pVal = pulse ? parseInt(pulse, 10) : null;

    if (sysInput && diaInput) {
      setPendingScans((prev) => [
        ...prev,
        {
          sys: parseInt(sysInput, 10),
          dia: parseInt(diaInput, 10),
          pulse: pulseInput ? parseInt(pulseInput, 10) : null
        }
      ]);
    }

    setSysInput(String(sVal));
    setDiaInput(String(dVal));
    setPulseInput(pVal ? String(pVal) : '');
    
    // Сбрасываем таймер на 0, давая еще 5 минут после нового скана
    setSeriesStartTime(Date.now());

    setScannerOpen(false);
    setTimeout(() => setFlashHighlight(true), 50);
    setTimeout(() => setFlashHighlight(false), 1250);
  }, [sysInput, diaInput, pulseInput]);

  if (!isOpen) return null;

  const handleSysChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setSysInput(val);
    if (val.length === 3 || (val.length === 2 && parseInt(val, 10) >= 85 && parseInt(val, 10) <= 99)) {
      if (diaRef.current) diaRef.current.focus();
    }
  };

  const handleDiaChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setDiaInput(val);
    if (val.length === 3 || (val.length === 2 && parseInt(val, 10) >= 45)) {
      if (pulseRef.current) pulseRef.current.focus();
    }
  };

  const handlePulseChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 3);
    setPulseInput(val);

    if (pulseBlurTimerRef.current) {
      clearTimeout(pulseBlurTimerRef.current);
      pulseBlurTimerRef.current = null;
    }

    const num = parseInt(val, 10);
    if (val.length === 3) {
      pulseRef.current?.blur();
    } else if (val.length === 2 && num >= 35 && num <= 99) {
      pulseBlurTimerRef.current = setTimeout(() => {
        pulseRef.current?.blur();
      }, 120);
    } else if (val.length === 2 && (val.startsWith('1') || val.startsWith('2'))) {
      pulseBlurTimerRef.current = setTimeout(() => {
        pulseRef.current?.blur();
      }, 900);
    }
  };

  const handleScanButtonClick = () => {
    if (!currentUser) {
      if (demoNoticeTimerRef.current) clearTimeout(demoNoticeTimerRef.current);
      setScanDemoNotice(true);
      demoNoticeTimerRef.current = setTimeout(() => {
        setScanDemoNotice(false);
      }, 2000);
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setScannerOpen(true);
  };

  const handleRemoveTagLocal = async (tagToRemove, e) => {
    e.stopPropagation();
    if (noteInput === tagToRemove) {
      setNoteInput('');
    }
    await onRemoveTag(tagToRemove);
  };

  const handleSaveClick = async () => {
    const s = parseInt(sysInput, 10);
    const d = parseInt(diaInput, 10);
    const p = pulseInput ? parseInt(pulseInput, 10) : null;

    if (!s || !d) return;

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    let totalCount = baseSeries ? baseSeries.count : 0;
    let sumSys = baseSeries ? baseSeries.sys * baseSeries.count : 0;
    let sumDia = baseSeries ? baseSeries.dia * baseSeries.count : 0;
    let sumPulse = baseSeries && baseSeries.pulse ? baseSeries.pulse * baseSeries.count : 0;
    let pulseCount = baseSeries && baseSeries.pulse ? baseSeries.count : 0;

    pendingScans.forEach((scan) => {
      totalCount += 1;
      sumSys += scan.sys;
      sumDia += scan.dia;
      if (scan.pulse) {
        sumPulse += scan.pulse;
        pulseCount += 1;
      }
    });

    totalCount += 1;
    sumSys += s;
    sumDia += d;
    if (p) {
      sumPulse += p;
      pulseCount += 1;
    }

    const savedData = {
      targetId: baseSeries?.targetId || null,
      seriesCount: totalCount,
      sys: Math.round(sumSys / totalCount),
      dia: Math.round(sumDia / totalCount),
      pulse: pulseCount > 0 ? Math.round(sumPulse / pulseCount) : null,
      note: noteInput.trim(),
      date: dateInput,
      time: timeInput
    };

    setSysInput('');
    setDiaInput('');
    setPulseInput('');
    setNoteInput('');
    setBaseSeries(null);
    setPendingScans([]);
    setSeriesStartTime(null);
    setTimerProgress(0);
    onClose();

    await onSaveRecord(savedData);
  };

  const hasInputs = Boolean(sysInput && diaInput);
  const currentUnsavedCount = pendingScans.length + (hasInputs ? 1 : 0);
  const totalSeriesCount = (baseSeries?.count || 0) + currentUnsavedCount;

  const showScanBadge = totalSeriesCount > 0;
  const scanBadgeValue = totalSeriesCount + 1;

  const showSaveBadge = currentUnsavedCount > 0 && totalSeriesCount > 1;
  const saveBadgeValue = totalSeriesCount;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none bp-backdrop-enter"
        style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : '0px' }}
        onClick={() => {
          if (!scannerOpen) onClose();
        }}
      >
        <form
          ref={addSheetRef}
          autoComplete="off"
          onSubmit={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            if (!scannerOpen) onTouchStart(e);
          }}
          onTouchMove={(e) => {
            if (!scannerOpen) onTouchMove(e);
          }}
          onTouchEnd={() => {
            if (!scannerOpen) onTouchEnd();
          }}
          style={{
            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
            transition: dragOffset === 0 ? 'transform 0.2s ease-out' : 'none',
            maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight + 8}px)` : '92vh'
          }}
          className={`w-full max-w-[440px] overflow-y-auto hide-scrollbar bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8 ${
            dragOffset === 0 ? 'bp-sheet-enter' : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto mb-5" />

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
              Новый замер
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0 mt-1"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          <div role="presentation" className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                  flashHighlight ? 'animate-flash-sys' : 'bg-[var(--sys-box-bg)]'
                }`}
              >
                <span className="block text-[15px] font-bold text-[var(--sys-box-label)] mb-1">
                  Верхнее
                </span>
                <input
                  ref={sysRef}
                  type="text"
                  name="nofill_bp_val_1"
                  inputMode="numeric"
                  enterKeyHint="next"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="120"
                  value={sysInput}
                  onChange={handleSysChange}
                  className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--sys-box-value)] placeholder-[var(--sys-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                />
              </div>

              <div
                className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                  flashHighlight ? 'animate-flash-dia' : 'bg-[var(--dia-box-bg)]'
                }`}
              >
                <span className="block text-[15px] font-bold text-[var(--dia-box-label)] mb-1">
                  Нижнее
                </span>
                <input
                  ref={diaRef}
                  type="text"
                  name="nofill_bp_val_2"
                  inputMode="numeric"
                  enterKeyHint="next"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="82"
                  value={diaInput}
                  onChange={handleDiaChange}
                  className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--dia-box-value)] placeholder-[var(--dia-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                />
              </div>

              <div
                className={`rounded-[26px] h-[110px] flex flex-col justify-center items-center p-2 relative overflow-hidden ${
                  flashHighlight ? 'animate-flash-pulse' : 'bg-[var(--pulse-box-bg)]'
                }`}
              >
                <span className="block text-[15px] font-bold text-[var(--pulse-box-label)] mb-1">
                  Пульс
                </span>
                <input
                  ref={pulseRef}
                  type="text"
                  name="nofill_bp_val_3"
                  inputMode="numeric"
                  enterKeyHint="done"
                  readOnly={!inputsUnlocked}
                  onFocus={() => setInputsUnlocked(true)}
                  onKeyDown={handleInputEnterBlur}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  aria-autocomplete="none"
                  placeholder="64"
                  value={pulseInput}
                  onChange={handlePulseChange}
                  className="w-full text-center text-[40px] tracking-tight leading-none font-extrabold text-[var(--pulse-box-value)] placeholder-[var(--pulse-box-placeholder)] opacity-80 focus:opacity-100 focus:outline-none bg-transparent select-text"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleScanButtonClick}
              className={`w-full h-[52px] rounded-full border bg-transparent font-bold text-[16px] flex items-center justify-center gap-2.5 transition cursor-pointer ${
                currentUser
                  ? 'text-[var(--import-btn-text)] active:scale-[0.99]'
                  : 'text-[var(--scan-btn-disabled-text)]'
              }`}
              style={{
                borderColor: currentUser
                  ? 'var(--import-btn-border)'
                  : 'var(--scan-btn-disabled-border)'
              }}
            >
              {scanDemoNotice ? (
                <span>Только в режиме пользователя</span>
              ) : (
                <>
                  <ScanFrameIcon className="w-5 h-5 shrink-0" />
                  <span>Сканировать прибор</span>
                  {showScanBadge && (
                    <span className="w-[22px] h-[22px] rounded-full border-[1.5px] border-current text-[11px] font-black flex items-center justify-center leading-none opacity-80 shrink-0 mt-[1px]">
                      ×{scanBadgeValue}
                    </span>
                  )}
                </>
              )}
            </button>

            <div className="bg-[var(--surface-input)] rounded-[26px] h-[72px] px-5 flex items-center justify-between relative overflow-hidden z-0">
              {/* Прогресс-бар окна замеров */}
              {currentUser && timerProgress > 0 && timerProgress < 100 && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-[var(--tag-bg)] z-[-1]"
                  style={{ 
                    width: `${timerProgress}%`, 
                    transition: 'width 1s linear'
                  }} 
                />
              )}
              
              <span className="text-[18px] font-bold text-[var(--text-primary)] pointer-events-none relative z-10">
                Время замера
              </span>
              
              <button
                type="button"
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  setTempTime(timeInput);
                  setTimePickerOpen(true);
                }}
                className="flex items-center gap-2 bg-[var(--surface-tertiary)] rounded-[20px] pl-4 pr-3 py-2.5 cursor-pointer active:scale-95 transition relative z-10 shadow-sm"
              >
                <span className="text-[22px] font-extrabold text-[var(--text-primary)] leading-none tabular-nums">
                  {timeInput}
                </span>
                <ChevronDown className="w-5 h-5 text-[var(--text-Subtle)] shrink-0 stroke-[2.5]" />
              </button>
            </div>

            {userTags.length > 0 && (
              <div className="flex flex-nowrap overflow-x-auto gap-2 hide-scrollbar pb-1 -mx-6 px-6">
                {userTags.map((tag) => {
                  const active = noteInput === tag;
                  return (
                    <div
                      key={tag}
                      onClick={() => setNoteInput(active ? '' : tag)}
                      className={`shrink-0 pl-5 pr-2.5 py-3 rounded-full text-[16px] font-bold flex items-center gap-2 transition cursor-pointer ${
                        active
                          ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)]'
                          : 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
                      }`}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveTagLocal(tag, e)}
                        title="Удалить подсказку"
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                          active
                            ? 'text-[var(--tab-active-text)] hover:opacity-70'
                            : 'text-[var(--tag-x)] hover:text-white'
                        }`}
                      >
                        <X className="w-4 h-4" strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-[var(--surface-input)] rounded-[24px] px-5 py-[18px]">
              <input
                ref={noteRef}
                type="text"
                name="nofill_bp_custom_memo"
                enterKeyHint="done"
                readOnly={!inputsUnlocked}
                onFocus={() => {
                  setInputsUnlocked(true);
                  scrollTargetIntoSheetView(saveCtaRef);
                }}
                onKeyDown={handleInputEnterBlur}
                autoComplete="new-password"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-form-type="other"
                aria-autocomplete="none"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Комментарий к замеру"
                className="w-full text-[16px] font-bold text-[var(--text-primary)] placeholder-[var(--placeholder-color)] focus:outline-none bg-transparent select-text"
              />
            </div>

            <button
              ref={saveCtaRef}
              type="button"
              onClick={handleSaveClick}
              className="w-full py-[20px] rounded-[28px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold flex items-center justify-center gap-2.5 active:scale-[0.99] transition cursor-pointer mt-1"
            >
              <span>Сохранить замер</span>
              {showSaveBadge && (
                <span className="w-[26px] h-[26px] rounded-full bg-white/20 text-white text-[13px] font-black flex items-center justify-center leading-none mt-[1px]">
                  ×{saveBadgeValue}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {scannerOpen && (
        <TonometerScannerModal
          currentUser={currentUser}
          onClose={() => setScannerOpen(false)}
          onDetected={handleScannerDetected}
        />
      )}

      {timePickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-end justify-center overscroll-none touch-none bp-backdrop-enter"
          onClick={() => setTimePickerOpen(false)}
        >
          <div
            className="w-full max-w-[440px] bg-[var(--bg-sheet)] rounded-t-[36px] px-6 pt-6 pb-8 flex flex-col gap-5 bp-sheet-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[var(--sheet-handle)] rounded-full mx-auto shrink-0" />

            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-[32px] font-extrabold text-[var(--text-primary)] leading-none tracking-tight">
                  Время замера
                </h3>
                <div className="text-[15px] font-medium text-[var(--text-secondary)]">
                  Выберите время измерения
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTimePickerOpen(false)}
                className="w-10 h-10 rounded-full bg-[var(--surface-input)] flex items-center justify-center text-[var(--text-primary)] shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="relative flex items-center justify-center w-full h-[340px] gap-4 mt-1">
              <DrumPicker
                options={HOURS_OPTIONS}
                value={tempTime.split(':')[0]}
                onChange={(h) => setTempTime(`${h}:${tempTime.split(':')[1]}`)}
              />

              <div
                className="z-10 text-[38px] font-extrabold leading-none pb-1.5 shrink-0 w-[20px] text-center select-none"
                style={{ color: 'var(--drum-colon)' }}
              >
                :
              </div>

              <DrumPicker
                options={MINUTES_OPTIONS}
                value={tempTime.split(':')[1]}
                onChange={(m) => setTempTime(`${tempTime.split(':')[0]}:${m}`)}
              />
            </div>

            <div className="w-full flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setTimeInput(tempTime);
                  setTimePickerOpen(false);
                }}
                className="w-full py-[18px] rounded-[28px] bg-[var(--cta-bg)] text-[var(--cta-text)] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
              >
                Подтвердить время
              </button>
              <button
                type="button"
                onClick={() => setTimePickerOpen(false)}
                className="w-full py-[18px] rounded-[28px] bg-[var(--surface-secondary)] text-[var(--text-primary)] text-[20px] font-bold active:scale-[0.99] transition cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
// 3. ШТОРКА НАСТРОЕК (ОБНОВЛЕННЫЙ ДИЗАЙН)
export const SettingsSheet = ({
  isOpen,
  onClose,
  currentUser,
  resolvedAvatar, // <--- ДОБАВИТЬ ЭТОТ ПРОП СЮДА
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

  // Вычисляем красивую статистику для плашек
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

  // Нативный системный импорт файла
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
    // Сбрасываем input, чтобы можно было выбрать тот же файл снова
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

        {/* Заголовок */}
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

{/* Профиль по центру */}
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

        {/* Три плашки статистики */}
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

        {/* Кнопки Импорт / Экспорт */}
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

        {/* Переключатель Тем */}
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

        {/* Низ шторки */}
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