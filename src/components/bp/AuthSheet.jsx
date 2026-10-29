import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_KEY, LEGACY_AVATAR_KEY, USER_THEME_PREFIX, DEFAULT_TAGS_ROMA, DEFAULT_TAGS_NEW_USER, handleInputEnterBlur, scrollTargetIntoSheetView } from './bpUtils';

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