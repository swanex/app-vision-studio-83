import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Plus,
  Heart,
  Activity,
  Settings,
  Search,
  RefreshCw,
  Sun,
  Moon,
  Camera,
  ChevronRight,
  User
} from 'lucide-react';

import {
  APP_BASE_VERSION,
  CODE_ITERATION_NUMBER,
  BUILD_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  LEGACY_AVATAR_KEY,
  USER_THEME_PREFIX,
  DEMO_THEME_SESSION_KEY,
  DEFAULT_TAGS_ROMA,
  DEFAULT_TAGS_NEW_USER,
  DEMO_RECORDS,
  formatHumanDate,
  pluralizeMeasurements,
  getGreetingByHour,
  getStatusLabel,
  deduplicateRecords,
  parseImportData,
  compressAvatarImage,
  handleInputEnterBlur,
  apiFetchUserRecords,
  apiUpsertRecords,
  apiDeleteRecord,
  apiPatchUserProfile
} from './bp/bpUtils';

import {
  CloudCheckIcon,
  CardTrashIcon,
  HomeNavIcon,
  HistoryNavIcon,
  AnimatedAvgPressure,
  AnimatedStatusBadge,
  BpThemeStyles
} from './bp/BpIconsAndWidgets';

import { AuthSheet, AddRecordSheet, SettingsSheet } from './bp/BpSheets';

export default function App() {
  const [buildNumber] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(BUILD_STORAGE_KEY) || '0', 10);
      const resolved = Math.max(CODE_ITERATION_NUMBER, isNaN(saved) ? 0 : saved);
      localStorage.setItem(BUILD_STORAGE_KEY, String(resolved));
      return resolved;
    } catch {
      return CODE_ITERATION_NUMBER;
    }
  });
  const appVersionString = `${APP_BASE_VERSION}.${buildNumber}`;

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [theme, setTheme] = useState(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const u = JSON.parse(savedSession);
        const savedUserTheme = localStorage.getItem(`${USER_THEME_PREFIX}${u.username}`) || u.theme;
        if (savedUserTheme === 'dark' || savedUserTheme === 'light') {
          return savedUserTheme;
        }
      } else {
        const demoTheme = sessionStorage.getItem(DEMO_THEME_SESSION_KEY);
        if (demoTheme === 'dark' || demoTheme === 'light') {
          return demoTheme;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const u = JSON.parse(saved);
        const cached = localStorage.getItem(`bp_records_cache_${u.username}`);
        if (cached) return deduplicateRecords(JSON.parse(cached));
      }
    } catch (e) {
      console.error(e);
    }
    return DEMO_RECORDS;
  });

  const [demoTags, setDemoTags] = useState(DEFAULT_TAGS_NEW_USER);
  const [cloudStatus, setCloudStatus] = useState('online');
  const [rawCloudCount, setRawCloudCount] = useState(() => DEMO_RECORDS.length);
  const [activeTab, setActiveTab] = useState('home');
  const [period, setPeriod] = useState('30d');
  const [dayTimeFilter, setDayTimeFilter] = useState('all');

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSheet, setActiveSheet] = useState(null);
  const [subOverlayState, setSubOverlayState] = useState({ scannerOpen: false, timePickerOpen: false });

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingPhaseById, setDeletingPhaseById] = useState({});

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartYRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const initialAvgDoneRef = useRef(false);
  const legendShownRef = useRef(false);
  const [badgeVisible, setBadgeVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = 'ru';
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');
    html.setAttribute('data-app-version', appVersionString);

    const ensureMeta = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    ensureMeta('google', 'notranslate');
    ensureMeta('mobile-web-app-capable', 'yes');
    ensureMeta('apple-mobile-web-app-capable', 'yes');
    ensureMeta('application-version', appVersionString);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      manifestLink.setAttribute('href', `/manifest.json?v=${appVersionString}`);
      document.head.appendChild(manifestLink);
    }
  }, [appVersionString]);

  const isAnyOverlayOpen = Boolean(
    activeSheet || subOverlayState.timePickerOpen || subOverlayState.scannerOpen
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseBgHex = theme === 'dark' ? '#111813' : '#F2F3F0';

    const statusBarHex = subOverlayState.scannerOpen
      ? '#141A16'
      : isAnyOverlayOpen
      ? theme === 'dark'
        ? '#0A0E0B'
        : '#919290'
      : baseBgHex;

    const html = document.documentElement;
    const body = document.body;

    html.style.backgroundColor = baseBgHex;
    html.style.colorScheme = theme;
    if (body) {
      body.style.backgroundColor = baseBgHex;
      body.style.colorScheme = theme;
    }

    const themeMetas = document.querySelectorAll('meta[name="theme-color"]');
    if (themeMetas.length > 0) {
      themeMetas.forEach((m) => m.setAttribute('content', statusBarHex));
    } else {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      meta.setAttribute('content', statusBarHex);
      document.head.appendChild(meta);
    }

    let statusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!statusMeta) {
      statusMeta = document.createElement('meta');
      statusMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      document.head.appendChild(statusMeta);
    }
    statusMeta.setAttribute('content', theme === 'dark' || isAnyOverlayOpen ? 'black-translucent' : 'default');
  }, [theme, isAnyOverlayOpen, subOverlayState.scannerOpen]);

  const handleSelectTheme = useCallback(
    (nextTheme) => {
      setTheme(nextTheme);
      try {
        if (currentUser) {
          localStorage.setItem(`${USER_THEME_PREFIX}${currentUser.username}`, nextTheme);
          const updatedUser = { ...currentUser, theme: nextTheme };
          setCurrentUser(updatedUser);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem(DEMO_THEME_SESSION_KEY, nextTheme);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [currentUser]
  );

  const handleInitialAvgComplete = useCallback(() => {
    initialAvgDoneRef.current = true;
    setBadgeVisible(true);
  }, []);

  const handleChartInitialAnimationEnd = useCallback(() => {
    if (!legendShownRef.current) {
      legendShownRef.current = true;
      setLegendVisible(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;

    const handleViewportResize = () => {
      const occupiedBottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(occupiedBottom > 90 ? Math.round(occupiedBottom) : 0);
    };

    vv.addEventListener('resize', handleViewportResize);
    vv.addEventListener('scroll', handleViewportResize);
    handleViewportResize();

    return () => {
      vv.removeEventListener('resize', handleViewportResize);
      vv.removeEventListener('scroll', handleViewportResize);
    };
  }, []);

  const userTags = useMemo(() => {
    if (!currentUser) return demoTags.slice(0, 4);
    if (Array.isArray(currentUser.tags)) return currentUser.tags.slice(0, 4);
    return currentUser.username === 'swanex' ? DEFAULT_TAGS_ROMA : DEFAULT_TAGS_NEW_USER;
  }, [currentUser, demoTags]);

  const saveSessionLocally = useCallback((userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userObj));
  }, []);

  const updateProfileInCloud = useCallback(
    async (userObj, patchFields) => {
      if (!userObj) return;
      const updatedUser = { ...userObj, ...patchFields };
      saveSessionLocally(updatedUser);
      try {
        await apiPatchUserProfile(userObj, patchFields);
      } catch (e) {
        console.error(e);
      }
    },
    [saveSessionLocally]
  );

  const emulateCloudSync = useCallback(() => {
    setCloudStatus('syncing');
    setTimeout(() => {
      setCloudStatus('online');
    }, 650);
  }, []);

  const fetchFromCloud = useCallback(
    async (userOverride) => {
      const activeUser = userOverride !== undefined ? userOverride : currentUser;
      if (!activeUser) {
        emulateCloudSync();
        return;
      }

      setCloudStatus('syncing');
      try {
        const data = await apiFetchUserRecords(activeUser);
        if (Array.isArray(data)) {
          setRawCloudCount(data.length);
          const unique = deduplicateRecords(data);
          setRecords(unique);
          localStorage.setItem(`bp_records_cache_${activeUser.username}`, JSON.stringify(unique));
          setCloudStatus('online');
        }
      } catch (err) {
        console.error(err);
        setCloudStatus('error');
      }
    },
    [currentUser, emulateCloudSync]
  );

  useEffect(() => {
    if (currentUser) {
      fetchFromCloud(currentUser);
    } else {
      setRawCloudCount(records.length);
    }
  }, [currentUser, fetchFromCloud]);

  useEffect(() => {
    setConfirmDeleteId(null);
  }, [activeTab]);

  const handleAuthSuccess = useCallback(
    async (userObj, mode, shouldUploadLegacyAvatar, legacyAvatar) => {
      saveSessionLocally(userObj);
      if (mode === 'login') {
        if (shouldUploadLegacyAvatar && legacyAvatar) {
          updateProfileInCloud(userObj, { avatar: legacyAvatar });
        }
        await fetchFromCloud(userObj);
      } else {
        setRecords([]);
        setRawCloudCount(0);
      }
    },
    [fetchFromCloud, saveSessionLocally, updateProfileInCloud]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(DEMO_THEME_SESSION_KEY);
    setCurrentUser(null);
    setTheme('light');
    setRecords(DEMO_RECORDS);
    setRawCloudCount(DEMO_RECORDS.length);
    setDemoTags(DEFAULT_TAGS_NEW_USER);
    setActiveSheet(null);
  }, []);

  useEffect(() => {
    if (activeSheet) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
    setDragOffset(0);
  }, [activeSheet]);

  const handleSheetTouchStart = useCallback(
    (e) => {
      if (keyboardHeight > 0) return;
      touchStartYRef.current = e.touches[0].clientY;
    },
    [keyboardHeight]
  );

  const handleSheetTouchMove = useCallback(
    (e) => {
      if (keyboardHeight > 0 || touchStartYRef.current === null) return;
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    },
    [keyboardHeight]
  );

  const handleSheetTouchEnd = useCallback(() => {
    if (keyboardHeight > 0) return;
    if (dragOffset > 85) {
      setActiveSheet(null);
    }
    setDragOffset(0);
    touchStartYRef.current = null;
  }, [dragOffset, keyboardHeight]);

  const upsertToCloud = useCallback(
    async (itemsArray) => {
      if (!currentUser) return;
      setCloudStatus('syncing');
      try {
        await apiUpsertRecords(currentUser, itemsArray);
        setCloudStatus('online');
      } catch (e) {
        console.error(e);
        setCloudStatus('error');
      }
    },
    [currentUser]
  );

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const compressedDataUrl = await compressAvatarImage(file);
    if (currentUser.username === 'swanex') {
      localStorage.setItem(LEGACY_AVATAR_KEY, compressedDataUrl);
    }
    await updateProfileInCloud(currentUser, { avatar: compressedDataUrl });
  };

  const handleRemoveTag = useCallback(
    async (tagToRemove) => {
      const nextTags = userTags.filter((t) => t !== tagToRemove);
      if (!currentUser) {
        setDemoTags(nextTags);
        return;
      }
      await updateProfileInCloud(currentUser, { tags: nextTags });
    },
    [currentUser, updateProfileInCloud, userTags]
  );

  const handleSaveRecord = useCallback(
    async ({ sys, dia, pulse, note, date, time }) => {
      const activeUsername = currentUser ? currentUser.username : 'demo';
      const recordIdPrefix = activeUsername === 'swanex' ? 'r' : `r-${activeUsername}`;
      const uniqueTimeId = Date.now().toString().slice(-5);

      const newItem = {
        id: `${recordIdPrefix}-${date}-${time.replace(':', '')}-${uniqueTimeId}`,
        username: activeUsername,
        date,
        time,
        sys,
        dia,
        pulse,
        note: note || 'Замер'
      };

      if (note && note !== 'Замер' && !userTags.includes(note) && userTags.length < 4) {
        const updatedTags = [...userTags, note];
        if (currentUser) {
          updateProfileInCloud(currentUser, { tags: updatedTags });
        } else {
          setDemoTags(updatedTags);
        }
      }

      const updated = deduplicateRecords([...records, newItem]);
      setRecords(updated);
      setRawCloudCount(updated.length);

      if (currentUser) {
        localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
        await upsertToCloud([newItem]);
      } else {
        emulateCloudSync();
      }
    },
    [currentUser, emulateCloudSync, records, updateProfileInCloud, upsertToCloud, userTags]
  );

  const handleConfirmDelete = useCallback(
    (id) => {
      if (deletingPhaseById[id]) return;

      setDeletingPhaseById((prev) => ({ ...prev, [id]: 'fade' }));

      setTimeout(() => {
        setDeletingPhaseById((prev) => ({ ...prev, [id]: 'collapse' }));
      }, 170);

      setTimeout(async () => {
        setConfirmDeleteId((prev) => (prev === id ? null : prev));
        setDeletingPhaseById((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });

        setRecords((prevRecords) => {
          const updated = prevRecords.filter((item) => item.id !== id);
          setRawCloudCount(updated.length);
          if (currentUser) {
            localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
          }
          return updated;
        });

        if (currentUser) {
          await apiDeleteRecord(currentUser, id);
        } else {
          emulateCloudSync();
        }
      }, 390);
    },
    [currentUser, deletingPhaseById, emulateCloudSync]
  );

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) =>
      `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (sortedRecords.length === 0) return [];
    const lastDateStr = sortedRecords[sortedRecords.length - 1].date;
    const anchor = new Date(`${lastDateStr}T23:59:59`);

    let cutoff = null;
    if (period === '7d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (period === '30d') {
      cutoff = new Date(anchor);
      cutoff.setDate(cutoff.getDate() - 30);
    }

    return sortedRecords.filter((r) => {
      if (cutoff) {
        const d = new Date(`${r.date}T12:00:00`);
        if (d < cutoff) return false;
      }
      if (dayTimeFilter !== 'all') {
        const hour = parseInt((r.time || '09:00').split(':')[0], 10);
        if (dayTimeFilter === 'morning' && hour >= 13) return false;
        if (dayTimeFilter === 'evening' && hour < 13) return false;
      }
      return true;
    });
  }, [sortedRecords, period, dayTimeFilter]);

  const chartData = useMemo(() => {
    return filteredRecords.map((r) => ({
      ...r,
      shortLabel: formatHumanDate(r.date)
    }));
  }, [filteredRecords]);

  useEffect(() => {
    if (chartData.length > 0 && !legendShownRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        legendShownRef.current = true;
        setLegendVisible(true);
        return;
      }

      const fallbackTimer = setTimeout(() => {
        if (!legendShownRef.current) {
          legendShownRef.current = true;
          setLegendVisible(true);
        }
      }, 430);

      return () => clearTimeout(fallbackTimer);
    }
  }, [chartData.length]);

  const stats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        avgSys: 0,
        avgDia: 0,
        avgPulse: '–',
        firstDate: null,
        lastDate: null,
        latest: sortedRecords[sortedRecords.length - 1] || null
      };
    }
    let sysSum = 0;
    let diaSum = 0;
    let pulseSum = 0;
    let pulseCnt = 0;

    filteredRecords.forEach((r) => {
      sysSum += r.sys;
      diaSum += r.dia;
      if (r.pulse) {
        pulseSum += r.pulse;
        pulseCnt += 1;
      }
    });

    const cnt = filteredRecords.length;
    return {
      avgSys: Math.round(sysSum / cnt),
      avgDia: Math.round(diaSum / cnt),
      avgPulse: pulseCnt > 0 ? Math.round(pulseSum / pulseCnt) : '–',
      firstDate: filteredRecords[0].date,
      lastDate: filteredRecords[cnt - 1].date,
      latest: sortedRecords[sortedRecords.length - 1]
    };
  }, [filteredRecords, sortedRecords]);

  const handleExportCSV = useCallback(() => {
    const header = 'Дата;Время;Верхнее;Нижнее;Пульс;Заметка\n';
    const body = [...sortedRecords]
      .reverse()
      .map((r) => `${r.date};${r.time};${r.sys};${r.dia};${r.pulse || ''};${r.note || ''}`)
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pressure_${currentUser?.username || 'demo'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentUser?.username, sortedRecords]);

  const handleImportRawText = useCallback(
    async (rawText) => {
      const activeUsername = currentUser ? currentUser.username : 'demo';
      const parsed = parseImportData(rawText, activeUsername);
      if (parsed.length === 0) return false;

      const updated = deduplicateRecords([...records, ...parsed]);
      setRecords(updated);
      setRawCloudCount(updated.length);
      if (currentUser) {
        localStorage.setItem(`bp_records_cache_${currentUser.username}`, JSON.stringify(updated));
        await upsertToCloud(parsed);
      } else {
        emulateCloudSync();
      }
      return true;
    },
    [currentUser, emulateCloudSync, records, upsertToCloud]
  );

  const historyList = useMemo(() => {
    const rev = [...sortedRecords].reverse();
    if (!searchQuery.trim()) return rev;
    const q = searchQuery.toLowerCase();
    return rev.filter(
      (r) =>
        (r.note && r.note.toLowerCase().includes(q)) ||
        r.date.includes(q) ||
        `${r.sys}/${r.dia}`.includes(q)
    );
  }, [sortedRecords, searchQuery]);

  const latestRec = stats.latest;
  const avgBadge = getStatusLabel(stats.avgSys, stats.avgDia);
  const greetingText = getGreetingByHour();

  const periodRangeLabel = useMemo(() => {
    if (!stats.firstDate || !stats.lastDate) return 'Нет записей за выбранный период';
    const startStr = formatHumanDate(stats.firstDate);
    const endStr = formatHumanDate(stats.lastDate);
    const count = filteredRecords.length;
    const rangePart = startStr === endStr ? startStr : `${startStr} – ${endStr}`;
    return `${rangePart} · ${count} ${pluralizeMeasurements(count)}`;
  }, [stats.firstDate, stats.lastDate, filteredRecords.length]);

  const resolvedAvatar = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.avatar) return currentUser.avatar;
    if (currentUser.username === 'swanex') {
      return localStorage.getItem(LEGACY_AVATAR_KEY) || null;
    }
    return null;
  }, [currentUser]);

  return (
    <div
      data-theme={theme}
      lang="ru"
      translate="no"
      className="notranslate min-h-screen bg-[var(--bg-outer)] text-[var(--text-primary)] flex justify-center font-sans select-none bp-theme-surface"
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <BpThemeStyles />

      <div className="w-full max-w-[440px] min-h-screen bg-[var(--bg-app)] pb-28 px-5 relative flex flex-col bp-theme-surface">
        <div
          className={
            activeTab === 'history'
              ? 'sticky top-0 z-20 bg-[var(--bg-app)] pt-6 pb-2.5'
              : 'pt-6 mb-5'
          }
        >
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {currentUser ? (
                <>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    title="Нажмите, чтобы сменить аватар"
                    className="w-[50px] h-[50px] rounded-full overflow-hidden bg-[var(--avatar-bg)] shrink-0 relative group cursor-pointer flex items-center justify-center text-[var(--avatar-icon)]"
                  >
                    {resolvedAvatar ? (
                      <img
                        src={resolvedAvatar}
                        alt={currentUser.display_name}
                        draggable={false}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <User className="w-5 h-5 text-[var(--avatar-icon)]" strokeWidth={2} />
                    )}
                    <span className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                      <Camera className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text-secondary)] font-medium leading-tight whitespace-nowrap">
                      {greetingText}
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] leading-snug truncate">
                      {currentUser.display_name}
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setActiveSheet('auth')}
                  className="flex items-center gap-3 min-w-0 text-left active:opacity-80 transition cursor-pointer"
                >
                  <div className="w-[50px] h-[50px] rounded-full bg-[var(--avatar-bg)] shrink-0 flex items-center justify-center text-[var(--avatar-icon)]">
                    <User className="w-5 h-5 text-[var(--avatar-icon)]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-[var(--text-secondary)] font-medium leading-tight whitespace-nowrap">
                      Демо-режим
                    </div>
                    <div className="text-[17px] font-extrabold tracking-tight text-[var(--text-primary)] leading-snug whitespace-nowrap inline-flex items-center gap-1">
                      <span>Войти</span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-primary)] shrink-0 stroke-[2.6]" />
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (currentUser) {
                    fetchFromCloud(currentUser);
                  } else {
                    emulateCloudSync();
                  }
                }}
                title={
                  !currentUser
                    ? 'Демо-режим (локальная сессия)'
                    : cloudStatus === 'online'
                    ? 'Синхронизировано'
                    : cloudStatus === 'syncing'
                    ? 'Синхронизация...'
                    : 'Ошибка подключения'
                }
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center active:scale-95 transition cursor-pointer text-[var(--text-primary)]"
                aria-label="Статус облачной синхронизации"
              >
                {cloudStatus === 'syncing' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[var(--text-primary)]" />
                ) : (
                  <CloudCheckIcon className="w-5 h-5 text-[var(--text-primary)]" />
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('history');
                  setSearchOpen((prev) => !prev);
                }}
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
                aria-label="Поиск"
              >
                <Search className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveSheet('data')}
                className="w-11 h-11 rounded-full bg-[var(--surface-card)] flex items-center justify-center text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
                aria-label="Настройки"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {activeTab === 'history' && (
            <div className="mt-5">
              {searchOpen && (
                <div className="mb-3">
                  <input
                    type="text"
                    name="nofill_bp_search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleInputEnterBlur}
                    placeholder="Найти: кофе, трени, сахар, утро..."
                    className="w-full bg-[var(--surface-card)] rounded-[22px] px-5 py-3.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none select-text"
                  />
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-[var(--text-muted)]">
                  Уникальных замеров: {historyList.length}
                </span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-[var(--text-primary)] underline cursor-pointer"
                  >
                    Сбросить поиск
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {activeTab === 'home' && (
          <main className="space-y-4">
            <div className="bg-[var(--surface-card)] rounded-[30px] p-1.5 grid grid-cols-3">
              {[
                { id: '7d', label: 'Неделя' },
                { id: '30d', label: 'Месяц' },
                { id: 'all', label: 'Год' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`py-3 rounded-[26px] text-[15px] font-semibold transition cursor-pointer ${
                    period === tab.id
                      ? 'bg-[var(--period-active-bg)] text-[var(--period-active-text)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <section className="bg-[var(--surface-card)] rounded-[32px] p-5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <AnimatedAvgPressure
                  sys={stats.avgSys}
                  dia={stats.avgDia}
                  isInitialDone={initialAvgDoneRef.current}
                  onInitialComplete={handleInitialAvgComplete}
                />
                <AnimatedStatusBadge
                  badge={avgBadge}
                  visible={badgeVisible || initialAvgDoneRef.current}
                />
              </div>

              <div className="mb-4">
                <div className="text-[16px] font-bold text-[var(--text-primary)]">Среднее за период</div>
                <div className="text-[14px] font-medium text-[var(--text-muted)] mt-0.5">{periodRangeLabel}</div>
              </div>

              <div className="h-[150px] w-full -mx-2 relative">
                {chartData.length > 0 && (
                  <>
                    <div
                      className={`absolute right-[2px] top-[12px] text-[11px] font-bold pointer-events-none z-10 bp-legend-opacity ${
                        legendVisible || legendShownRef.current ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ color: 'var(--upper-pressure)' }}
                    >
                      Верхнее
                    </div>
                    <div
                      className={`absolute right-[2px] top-[100px] text-[11px] font-bold pointer-events-none z-10 bp-legend-opacity ${
                        legendVisible || legendShownRef.current ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{ color: 'var(--lower-pressure)' }}
                    >
                      Нижнее
                    </div>
                  </>
                )}

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" className="relative z-0">
                    <AreaChart data={chartData} margin={{ top: 12, right: 0, left: -26, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-sys-grad-start)" stopOpacity={theme === 'dark' ? 0.35 : 0.8} />
                          <stop offset="95%" stopColor="var(--chart-sys-grad-end)" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="diaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--chart-dia-grad-start)" stopOpacity={theme === 'dark' ? 0.32 : 0.75} />
                          <stop offset="95%" stopColor="var(--chart-dia-grad-end)" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
                        minTickGap={34}
                      />
                      <YAxis
                        domain={[60, 152]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 13, fill: 'var(--text-muted)' }}
                        ticks={[75, 100, 125]}
                      />
                      <Tooltip
                        wrapperStyle={{ zIndex: 100 }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[var(--tooltip-bg)] text-[var(--tooltip-text)] rounded-[20px] px-4 py-3">
                              <div className="text-xs text-[var(--tooltip-sub)] mb-0.5">
                                {formatHumanDate(item.date)} · {item.time}
                              </div>
                              <div className="text-lg font-bold">
                                {item.sys}/{item.dia}{' '}
                                {item.pulse && (
                                  <span className="text-sm font-normal text-[#D6EBB4] ml-1">
                                    ♥ {item.pulse}
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <div className="text-xs text-[var(--tooltip-note)] mt-1 max-w-[200px] leading-snug">
                                  {item.note}
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sys"
                        stroke="var(--upper-pressure)"
                        strokeWidth={2.4}
                        fill="url(#sysFill)"
                        animationDuration={380}
                        onAnimationEnd={handleChartInitialAnimationEnd}
                        activeDot={{ r: 5, fill: 'var(--upper-pressure)', stroke: 'var(--dot-stroke)', strokeWidth: 2 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="dia"
                        stroke="var(--lower-pressure)"
                        strokeWidth={2.4}
                        fill="url(#diaFill)"
                        animationDuration={380}
                        activeDot={{ r: 5, fill: 'var(--lower-pressure)', stroke: 'var(--dot-stroke)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-center px-6 text-sm text-[var(--text-faint)]">
                    Нажмите «+» внизу экрана, чтобы добавить первый замер
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2.5">
                <button
                  onClick={() => setDayTimeFilter('all')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold transition cursor-pointer text-center ${
                    dayTimeFilter === 'all'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  Все
                </button>

                <button
                  onClick={() => setDayTimeFilter('morning')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'morning'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--surface-tertiary)] text-[var(--text-Subtle)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Sun className="w-[18px] h-[18px] text-[#FE9A00] fill-[#FE9A00]" />
                  <span>Утро</span>
                </button>

                <button
                  onClick={() => setDayTimeFilter('evening')}
                  className={`flex-1 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    dayTimeFilter === 'evening'
                      ? 'bg-[var(--filter-active-bg)] text-[var(--filter-active-text)]'
                      : 'bg-[var(--filter-evening-bg)] text-[var(--filter-evening-text)] hover:opacity-90'
                  }`}
                >
                  <Moon className="w-[18px] h-[18px] text-[#615FFF] fill-[#615FFF]" />
                  <span>Вечер</span>
                </button>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-[28px] bg-[var(--card-latest-bg)] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[var(--text-primary)]">
                    {latestRec ? `${latestRec.sys}/${latestRec.dia}` : '–'}
                  </div>
                  <div className="text-[14px] font-bold text-[var(--card-latest-date)] mt-1.5">
                    {latestRec ? formatHumanDate(latestRec.date) : '–'}
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                    Последний
                    <br />
                    замер
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-[var(--stat-icon-circle-bg)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                    <Activity className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card-pulse-bg)] rounded-[28px] p-5 flex flex-col justify-between h-[152px]">
                <div>
                  <div className="text-[36px] font-black tracking-tight leading-none text-[var(--text-primary)]">
                    {stats.avgPulse}
                  </div>
                  <div className="text-[14px] text-[var(--text-Subtle)] font-bold mt-1.5">
                    уд/мин
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-[14px] font-bold leading-tight text-[var(--text-primary)]">
                    Средний
                    <br />
                    пульс
                  </div>
                  <div className="w-[44px] h-[44px] rounded-full bg-[var(--stat-icon-circle-bg)] flex items-center justify-center text-[var(--text-primary)] shrink-0">
                    <Heart className="w-[22px] h-[22px]" strokeWidth={2.2} />
                  </div>
                </div>
              </div>
            </section>
          </main>
        )}

        {activeTab === 'history' && (
          <main className="flex flex-col">
            {historyList.map((item) => {
              const badge = getStatusLabel(item.sys, item.dia);
              const isConfirmOpen = confirmDeleteId === item.id;
              const deletePhase = deletingPhaseById[item.id];
              const isFading = deletePhase === 'fade';
              const isCollapsing = deletePhase === 'collapse';

              return (
                <div
                  key={item.id}
                  style={{
                    maxHeight: isCollapsing ? '0px' : '150px',
                    marginBottom: isCollapsing ? '0px' : '12px',
                    opacity: isFading || isCollapsing ? 0 : 1,
                    transform: isFading || isCollapsing ? 'scale(0.98)' : 'scale(1)',
                    transition: isCollapsing
                      ? 'max-height 220ms cubic-bezier(0.22, 1, 0.36, 1), margin-bottom 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease-out'
                      : 'opacity 160ms ease-out, transform 160ms ease-out'
                  }}
                  className="overflow-hidden"
                >
                  <div className="bg-[var(--surface-card)] rounded-[26px] px-4 py-[18px] relative flex flex-col justify-between min-h-[117.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2.5 min-w-0">
                        <span className="text-[29px] font-extrabold tracking-tight leading-none text-[var(--text-primary)] tabular-nums">
                          {item.sys}/{item.dia}
                        </span>
                        {item.pulse && (
                          <span className="inline-flex items-center gap-1.5 text-[21px] font-bold leading-none text-[var(--lower-pressure)] tabular-nums">
                            <span className="text-[19px] leading-none">♥</span>
                            <span>{item.pulse}</span>
                          </span>
                        )}
                      </div>

                      <span
                        className="h-[26px] px-3 rounded-full text-[12px] font-bold inline-flex items-center justify-center shrink-0 leading-none"
                        style={{ backgroundColor: badge.bg, color: badge.textCol }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between relative min-h-[42px]">
                      <div
                        className={`min-w-0 transition-all duration-200 ${
                          isConfirmOpen ? 'max-w-[calc(100%-156px)] pr-2' : 'max-w-[calc(100%-44px)] pr-2'
                        }`}
                      >
                        <div className="text-[16px] font-medium text-[var(--text-Subtle)] leading-snug truncate">
                          {item.note || 'Замер'}
                        </div>
                        <div className="text-[15px] font-medium text-[var(--text-faint)] leading-snug mt-1 truncate">
                          {formatHumanDate(item.date)} в {item.time}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        {isConfirmOpen ? (
                          <div className="flex items-center gap-2 bp-delete-actions-enter">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(item.id)}
                              style={{
                                backgroundColor: 'var(--del-confirm-bg)',
                                color: 'var(--del-confirm-text)'
                              }}
                              className="h-[34px] px-3.5 rounded-[17px] text-[13px] font-bold inline-flex items-center justify-center active:scale-95 transition cursor-pointer"
                            >
                              Удалить
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              style={{
                                backgroundColor: 'var(--del-cancel-bg)',
                                color: 'var(--del-cancel-text)'
                              }}
                              className="h-[34px] px-3.5 rounded-[17px] text-[13px] font-bold inline-flex items-center justify-center active:scale-95 transition cursor-pointer"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="w-9 h-9 -mr-1 -mb-1 rounded-full flex items-center justify-center text-[var(--delete-icon)] hover:text-[var(--text-primary)] active:scale-95 transition cursor-pointer"
                            title="Удалить запись"
                            aria-label="Удалить запись"
                          >
                            <CardTrashIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </main>
        )}

        <nav className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-5 pointer-events-none">
          <div
            className="w-full max-w-[400px] h-[68px] bg-[var(--surface-card)] rounded-[34px] px-12 flex items-center justify-between pointer-events-auto"
            style={{ boxShadow: 'var(--nav-shadow)', border: '1px solid var(--nav-border)' }}
          >
            <button
              onClick={() => setActiveTab('home')}
              className="active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="Главная"
            >
              <HomeNavIcon solid={activeTab === 'home'} />
            </button>

            <button
              onClick={() => setActiveSheet('add')}
              className="w-[64px] h-[64px] -mt-6 rounded-full bg-[var(--cta-bg)] text-[var(--cta-text)] flex items-center justify-center active:scale-95 transition cursor-pointer"
              aria-label="Добавить замер"
            >
              <Plus className="w-[32px] h-[32px]" strokeWidth={2.2} />
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="active:scale-95 transition cursor-pointer flex items-center justify-center"
              aria-label="История"
            >
              <HistoryNavIcon solid={activeTab === 'history'} />
            </button>
          </div>
        </nav>

        <AuthSheet
          isOpen={activeSheet === 'auth'}
          onClose={() => setActiveSheet(null)}
          theme={theme}
          setTheme={setTheme}
          keyboardHeight={keyboardHeight}
          dragOffset={dragOffset}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onAuthSuccess={handleAuthSuccess}
        />

        <AddRecordSheet
          isOpen={activeSheet === 'add'}
          onClose={() => setActiveSheet(null)}
          currentUser={currentUser}
          userTags={userTags}
          onRemoveTag={handleRemoveTag}
          onSaveRecord={handleSaveRecord}
          keyboardHeight={keyboardHeight}
          dragOffset={dragOffset}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onOverlayStateChange={setSubOverlayState}
        />

        <SettingsSheet
          isOpen={activeSheet === 'data'}
          onClose={() => setActiveSheet(null)}
          currentUser={currentUser}
          rawCloudCount={rawCloudCount}
          recordsCount={records.length}
          theme={theme}
          onSelectTheme={handleSelectTheme}
          onExportCSV={handleExportCSV}
          onImportRawText={handleImportRawText}
          onLogout={handleLogout}
          onOpenAuth={() => setActiveSheet('auth')}
          appVersionString={appVersionString}
          keyboardHeight={keyboardHeight}
          dragOffset={dragOffset}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        />
      </div>
    </div>
  );
}